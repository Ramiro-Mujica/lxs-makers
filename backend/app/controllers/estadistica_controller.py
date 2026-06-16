# app/controllers/estadistica_controller.py
import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config.database import get_db
from app.models.pedido import HistorialVenta

router = APIRouter(prefix="/estadisticas", tags=["Estadísticas"])
logger = logging.getLogger(__name__)


@router.get("/vendedor/{vendedor_id}")
def estadisticas_vendedor(vendedor_id: str, db: Session = Depends(get_db)):
    """Estadísticas del vendedor: productos más vendidos y mayor ganancia."""
    mas_vendidos = (
        db.query(
            HistorialVenta.producto_id,
            HistorialVenta.nombre_producto,
            func.sum(HistorialVenta.cantidad).label("total_cantidad"),
            func.sum(HistorialVenta.total_linea).label("total_ganancia"),
        )
        .filter(HistorialVenta.usuario_id == vendedor_id)
        .group_by(HistorialVenta.producto_id, HistorialVenta.nombre_producto)
        .order_by(func.sum(HistorialVenta.cantidad).desc())
        .limit(10)
        .all()
    )

    total_ventas = (
        db.query(func.sum(HistorialVenta.total_linea))
        .filter(HistorialVenta.usuario_id == vendedor_id)
        .scalar() or 0
    )

    total_pedidos = (
        db.query(func.count(func.distinct(HistorialVenta.pedido_id)))
        .filter(HistorialVenta.usuario_id == vendedor_id)
        .scalar() or 0
    )

    return {
        "total_ventas":             float(total_ventas),
        "total_pedidos_entregados": total_pedidos,
        "productos": [
            {
                "producto_id":    r.producto_id,
                "nombre":         r.nombre_producto,
                "total_cantidad": int(r.total_cantidad),
                "total_ganancia": float(r.total_ganancia),
            }
            for r in mas_vendidos
        ],
    }
