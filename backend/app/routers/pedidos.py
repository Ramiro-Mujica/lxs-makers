import logging
from app.services.notificaciones import notificador_pedidos
from datetime import datetime, timedelta, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.pedido import Pedido, DetallePedido
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.schemas.pedido import (
    PedidoSchema,
    PedidoCreateSchema,
    PedidoUpdateSchema,
    DetalleAgregarSchema,
    DetalleEditarSchema,
)
from app.security.auth import obtener_usuario_actual
from app.utils.codigo_generator import generar_codigo_seguimiento

logger = logging.getLogger(__name__)
router = APIRouter()

DIAS_HISTORIAL_PEDIDOS = 7


def _obtener_pedido_del_vendedor(pedido_id: UUID, usuario: Usuario, db: Session) -> Pedido:
    pedido = (
        db.query(Pedido)
        .filter(Pedido.id == pedido_id, Pedido.vendedor_id == usuario.id)
        .first()
    )
    if not pedido:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado.")
    return pedido


def _recalcular_total(pedido: Pedido, db: Session) -> None:
    pedido.total = sum((d.subtotal() for d in pedido.detalles), start=0)
    db.commit()


@router.get("/", response_model=List[PedidoSchema])
def listar_pedidos(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    desde = datetime.now(timezone.utc) - timedelta(days=DIAS_HISTORIAL_PEDIDOS)
    return (
        db.query(Pedido)
        .filter(Pedido.vendedor_id == usuario.id, Pedido.created_at >= desde)
        .order_by(Pedido.created_at.desc())
        .all()
    )


@router.post("/", response_model=PedidoSchema, status_code=status.HTTP_201_CREATED)
def crear_pedido(
    datos: PedidoCreateSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    codigo = generar_codigo_seguimiento()
    while db.query(Pedido).filter(Pedido.codigo_seguimiento == codigo).first():
        codigo = generar_codigo_seguimiento()

    pedido = Pedido(
        vendedor_id=usuario.id,
        codigo_seguimiento=codigo,
        **datos.model_dump(),
    )
    db.add(pedido)
    db.commit()
    db.refresh(pedido)
    logger.info(f"Pedido creado: {codigo} por {usuario.email}")
    return pedido


@router.get("/{pedido_id}", response_model=PedidoSchema)
def ver_pedido(
    pedido_id: UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return _obtener_pedido_del_vendedor(pedido_id, usuario, db)


@router.patch("/{pedido_id}", response_model=PedidoSchema)
def actualizar_pedido(
    pedido_id: UUID,
    datos: PedidoUpdateSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    pedido = _obtener_pedido_del_vendedor(pedido_id, usuario, db)
    estado_anterior = pedido.estado

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(pedido, campo, valor)

    if estado_anterior != "completado" and pedido.estado == "completado":
        pedido.completado_at = datetime.now(timezone.utc)
        notificador_pedidos.notificar_pedido_completado(pedido)

    db.commit()
    db.refresh(pedido)
    return pedido


@router.delete("/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_pedido(
    pedido_id: UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    pedido = _obtener_pedido_del_vendedor(pedido_id, usuario, db)
    db.delete(pedido)
    db.commit()


@router.post("/{pedido_id}/detalles", response_model=PedidoSchema)
def agregar_detalle(
    pedido_id: UUID,
    datos: DetalleAgregarSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    pedido = _obtener_pedido_del_vendedor(pedido_id, usuario, db)

    producto = (
        db.query(Producto)
        .filter(Producto.id == datos.producto_id, Producto.vendedor_id == usuario.id)
        .first()
    )
    if not producto:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado.")

    detalle_existente = (
        db.query(DetallePedido)
        .filter(
            DetallePedido.pedido_id == pedido.id,
            DetallePedido.producto_id == producto.id,
            DetallePedido.variante == datos.variante,
        )
        .first()
    )

    if detalle_existente:
        detalle_existente.cantidad += datos.cantidad
    else:
        nuevo_detalle = DetallePedido(
            pedido_id=pedido.id,
            producto_id=producto.id,
            nombre_producto=producto.nombre,
            precio_venta=producto.precio_venta,
            precio_costo=producto.precio_costo,
            cantidad=datos.cantidad,
            variante=datos.variante,
        )
        db.add(nuevo_detalle)

    db.commit()
    db.refresh(pedido)
    _recalcular_total(pedido, db)
    db.refresh(pedido)
    return pedido


@router.delete("/{pedido_id}/detalles/{detalle_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_detalle(
    pedido_id: UUID,
    detalle_id: UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    pedido = _obtener_pedido_del_vendedor(pedido_id, usuario, db)
    detalle = (
        db.query(DetallePedido)
        .filter(DetallePedido.id == detalle_id, DetallePedido.pedido_id == pedido.id)
        .first()
    )
    if not detalle:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontrado.")

    db.delete(detalle)
    db.commit()
    db.refresh(pedido)
    _recalcular_total(pedido, db)


@router.patch("/{pedido_id}/detalles/{detalle_id}/editar", response_model=PedidoSchema)
def editar_detalle(
    pedido_id: UUID,
    detalle_id: UUID,
    datos: DetalleEditarSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    pedido = _obtener_pedido_del_vendedor(pedido_id, usuario, db)
    detalle = (
        db.query(DetallePedido)
        .filter(DetallePedido.id == detalle_id, DetallePedido.pedido_id == pedido.id)
        .first()
    )
    if not detalle:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontrado.")

    detalle.cantidad = datos.cantidad
    db.commit()
    db.refresh(pedido)
    _recalcular_total(pedido, db)
    db.refresh(pedido)
    return pedido


@router.get("/seguimiento/{codigo}")
def seguimiento_publico(codigo: str, db: Session = Depends(get_db)):
    """Endpoint público — consulta de estado de pedido sin necesidad de cuenta."""
    pedido = db.query(Pedido).filter(Pedido.codigo_seguimiento == codigo).first()
    if not pedido or pedido.esta_vencido():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado o vencido.")

    detalles = [
        {
            "nombre_producto": d.nombre_producto,
            "variante": d.variante or "-",
            "cantidad": d.cantidad,
            "subtotal": float(d.subtotal()),
        }
        for d in pedido.detalles
    ]

    return {
        "codigo_seguimiento": pedido.codigo_seguimiento,
        "estado": pedido.estado,
        "total": float(pedido.total),
        "dias_restantes": pedido.dias_restantes,
        "detalles": detalles,
    }