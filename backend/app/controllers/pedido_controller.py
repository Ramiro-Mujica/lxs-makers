# app/controllers/pedido_controller.py
import logging
import bleach
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.config.database import get_db
from app.models.pedido import Pedido
from app.models.estadistica import EstadisticaMensual
from app.schemas.pedido_schema import PedidoCreate, PedidoUpdate
from app.utils.codigo_generator import generar_codigo_unico
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])
logger = logging.getLogger(__name__)

DIAS_VENCIMIENTO = 7


class PedidoCreateSimple(BaseModel):
    detalle:   Optional[str] = None
    total:     float
    usuario_id: str


class PedidoEstadoUpdate(BaseModel):
    estado_pedido: str
    descripcion:   Optional[str] = None


@router.get("/vendedor/{vendedor_id}")
def listar_pedidos(vendedor_id: str, db: Session = Depends(get_db)):
    """Lista pedidos activos de un vendedor (no vencidos)."""
    fecha_limite = datetime.utcnow() - timedelta(days=DIAS_VENCIMIENTO)
    pedidos = db.query(Pedido).filter(
        Pedido.usuario_id == vendedor_id,
        Pedido.created_at >= fecha_limite
    ).order_by(Pedido.created_at.desc()).all()

    return [
        {
            "id":                 p.id,
            "codigo_seguimiento": p.codigo_seguimiento,
            "detalle":            p.datos_carrito.get("detalle", "") if isinstance(p.datos_carrito, dict) else "",
            "total":              float(p.total),
            "estado_pedido":      p.estado_pedido,
            "descripcion":        p.comentario,
            "created_at":         p.created_at,
            "dias_restantes":     DIAS_VENCIMIENTO - (datetime.utcnow() - p.created_at).days,
        }
        for p in pedidos
    ]


@router.post("/vendedor/{vendedor_id}")
def crear_pedido(vendedor_id: str, datos: PedidoCreateSimple, db: Session = Depends(get_db)):
    """Crea un nuevo pedido manualmente y genera su código de seguimiento."""
    codigo = generar_codigo_unico(db, Pedido, "codigo_seguimiento")
    nuevo  = Pedido(
        id                 = str(uuid.uuid4()),
        usuario_id         = vendedor_id,
        codigo_seguimiento = codigo,
        datos_carrito      = {"detalle": datos.detalle or ""},
        total              = datos.total,
        estado_pedido      = "armando_pedido",
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    logger.info(f"Pedido creado: {codigo}")
    return {"mensaje": "Pedido creado correctamente.", "codigo_seguimiento": codigo}


@router.patch("/{pedido_id}/estado")
def actualizar_estado(pedido_id: str, datos: PedidoEstadoUpdate, db: Session = Depends(get_db)):
    """
    Actualiza el estado del pedido.
    Si pasa a 'enviado', registra en estadísticas mensuales.
    """
    if datos.estado_pedido not in ("armando_pedido", "enviado"):
        raise HTTPException(status_code=400, detail="Estado no válido.")

    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")

    estado_anterior      = pedido.estado_pedido
    pedido.estado_pedido = datos.estado_pedido

    if datos.descripcion is not None:
        pedido.comentario = bleach.clean(datos.descripcion.strip())

    # Si pasa a enviado por primera vez, actualizar estadísticas mensuales
    if datos.estado_pedido == "enviado" and estado_anterior != "enviado":
        ahora = datetime.utcnow()
        stat  = db.query(EstadisticaMensual).filter(
            EstadisticaMensual.usuario_id == pedido.usuario_id,
            EstadisticaMensual.mes        == ahora.month,
            EstadisticaMensual.anio       == ahora.year,
        ).first()

        if stat:
            stat.total_pedidos  += 1
            stat.total_ganancia += float(pedido.total)
        else:
            db.add(EstadisticaMensual(
                id             = str(uuid.uuid4()),
                usuario_id     = pedido.usuario_id,
                mes            = ahora.month,
                anio           = ahora.year,
                total_pedidos  = 1,
                total_ganancia = float(pedido.total),
            ))

    db.commit()
    logger.info(f"Pedido {pedido_id} → {datos.estado_pedido}")
    return {"mensaje": "Estado actualizado correctamente."}


@router.get("/seguimiento/{codigo}")
def consultar_seguimiento(codigo: str, db: Session = Depends(get_db)):
    """Consulta pública del estado de un pedido por código."""
    fecha_limite = datetime.utcnow() - timedelta(days=DIAS_VENCIMIENTO)
    pedido = db.query(Pedido).filter(
        Pedido.codigo_seguimiento == codigo.upper(),
        Pedido.created_at         >= fecha_limite
    ).first()

    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado o vencido.")

    estado_label = "Armando pedido" if pedido.estado_pedido == "armando_pedido" else "Enviado"

    return {
        "codigo_seguimiento": pedido.codigo_seguimiento,
        "estado_pedido":      pedido.estado_pedido,
        "estado_label":       estado_label,
        "descripcion":        pedido.comentario,
        "total":              float(pedido.total),
        "dias_restantes":     DIAS_VENCIMIENTO - (datetime.utcnow() - pedido.created_at).days,
    }