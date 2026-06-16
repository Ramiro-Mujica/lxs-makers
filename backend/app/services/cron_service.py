# app/services/cron_service.py
import logging
from datetime import datetime, timedelta
from app.config.database import DatabaseSingleton

logger           = logging.getLogger(__name__)
DIAS_VENCIMIENTO = 7


def purgar_pedidos_vencidos() -> None:
    """Elimina físicamente pedidos con más de 7 días. Se ejecuta cada 24 horas."""
    db = DatabaseSingleton().get_session()
    try:
        from app.models.pedido import Pedido
        fecha_limite = datetime.utcnow() - timedelta(days=DIAS_VENCIMIENTO)
        eliminados   = db.query(Pedido).filter(Pedido.created_at < fecha_limite).delete()
        db.commit()
        logger.info(f"Purga completada: {eliminados} pedido(s) eliminado(s).")
    except Exception as e:
        db.rollback()
        logger.error(f"Error en purga: {e}")
    finally:
        db.close()
