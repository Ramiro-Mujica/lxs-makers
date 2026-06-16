# app/controllers/pedido_controller.py
import logging
import bleach
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.pedido import Pedido, HistorialVenta
from app.models.producto import Producto
from app.schemas.pedido_schema import PedidoCreate, PedidoUpdate
from app.utils.codigo_generator import generar_codigo_unico
from datetime import datetime, timedelta

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])
logger = logging.getLogger(__name__)

DIAS_VENCIMIENTO = 7


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
            "datos_carrito":      p.datos_carrito,
            "total":              float(p.total),
            "estado_pedido":      p.estado_pedido,
            "comentario":         p.comentario,
            "created_at":         p.created_at,
            "dias_restantes":     DIAS_VENCIMIENTO - (datetime.utcnow() - p.created_at).days,
        }
        for p in pedidos
    ]


@router.post("/vendedor/{vendedor_id}")
def crear_pedido(vendedor_id: str, datos: PedidoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo pedido y genera su código de seguimiento."""
    codigo = generar_codigo_unico(db, Pedido, "codigo_seguimiento")
    nuevo  = Pedido(
        id                 = str(uuid.uuid4()),
        usuario_id         = vendedor_id,
        codigo_seguimiento = codigo,
        datos_carrito      = datos.datos_carrito,
        total              = datos.total,
        estado_pedido      = "pendiente",
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    logger.info(f"Pedido creado: {codigo}")
    return {"mensaje": "Pedido creado correctamente.", "codigo_seguimiento": codigo}


@router.patch("/{pedido_id}/estado")
def actualizar_estado(pedido_id: str, datos: PedidoUpdate, db: Session = Depends(get_db)):
    """Actualiza el estado. Si pasa a entregado, registra en historial."""
    pedido = db.query(Pedido).filter(Pedido.id == pedido_id).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")

    estado_anterior      = pedido.estado_pedido
    pedido.estado_pedido = datos.estado_pedido
    if datos.comentario is not None:
        pedido.comentario = bleach.clean(datos.comentario.strip())

    if datos.estado_pedido == "entregado" and estado_anterior != "entregado":
        carrito = pedido.datos_carrito
        if isinstance(carrito, list):
            for item in carrito:
                producto = db.query(Producto).filter(Producto.id == item.get("producto_id")).first()
                if producto:
                    db.add(HistorialVenta(
                        id              = str(uuid.uuid4()),
                        usuario_id      = pedido.usuario_id,
                        pedido_id       = pedido.id,
                        producto_id     = producto.id,
                        nombre_producto = producto.nombre,
                        precio_unitario = float(producto.precio),
                        cantidad        = item.get("cantidad", 1),
                        total_linea     = float(producto.precio) * item.get("cantidad", 1),
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

    return {
        "codigo_seguimiento": pedido.codigo_seguimiento,
        "estado_pedido":      pedido.estado_pedido,
        "total":              float(pedido.total),
        "dias_restantes":     DIAS_VENCIMIENTO - (datetime.utcnow() - pedido.created_at).days,
    }
