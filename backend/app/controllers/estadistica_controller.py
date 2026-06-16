# app/controllers/estadistica_controller.py
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.estadistica import EstadisticaMensual

router = APIRouter(prefix="/estadisticas", tags=["Estadísticas"])
logger = logging.getLogger(__name__)


@router.get("/vendedor/{vendedor_id}")
def estadisticas_vendedor(vendedor_id: str, db: Session = Depends(get_db)):
    """Retorna el historial mensual y anual del vendedor."""
    registros = db.query(EstadisticaMensual).filter(
        EstadisticaMensual.usuario_id == vendedor_id
    ).order_by(EstadisticaMensual.anio.desc(), EstadisticaMensual.mes.desc()).all()

    # Agrupar por año
    por_anio = {}
    for r in registros:
        if r.anio not in por_anio:
            por_anio[r.anio] = {"total_pedidos": 0, "total_ganancia": 0.0, "meses": []}
        por_anio[r.anio]["total_pedidos"]  += r.total_pedidos
        por_anio[r.anio]["total_ganancia"] += float(r.total_ganancia)
        por_anio[r.anio]["meses"].append({
            "mes":            r.mes,
            "total_pedidos":  r.total_pedidos,
            "total_ganancia": float(r.total_ganancia),
        })

    return {
        "resumen": [
            {
                "anio":           anio,
                "total_pedidos":  datos["total_pedidos"],
                "total_ganancia": datos["total_ganancia"],
                "meses":          datos["meses"],
            }
            for anio, datos in por_anio.items()
        ]
    }


@router.delete("/vendedor/{vendedor_id}/reiniciar")
def reiniciar_estadisticas(vendedor_id: str, db: Session = Depends(get_db)):
    """El vendedor puede reiniciar su contador de estadísticas."""
    eliminados = db.query(EstadisticaMensual).filter(
        EstadisticaMensual.usuario_id == vendedor_id
    ).delete()
    db.commit()
    logger.info(f"Estadísticas reiniciadas para vendedor {vendedor_id}")
    return {"mensaje": f"Estadísticas reiniciadas. {eliminados} registro(s) eliminado(s)."}