# app/config/database.py
# Patrón Singleton: garantiza una única instancia de conexión a MySQL
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.config.settings import settings

logger = logging.getLogger(__name__)


class DatabaseSingleton:
    """
    Patrón Singleton para la conexión a MySQL via SQLAlchemy.
    Garantiza que solo exista una instancia del engine en toda la app.
    """
    _instance: "DatabaseSingleton | None" = None
    _engine = None
    _session_factory = None

    def __new__(cls) -> "DatabaseSingleton":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self) -> None:
        """Inicializa el engine y la fábrica de sesiones."""
        db_url = (
            f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}"
            f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
            f"?charset=utf8mb4"
        )
        self._engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            echo=settings.DEBUG,
        )
        self._session_factory = sessionmaker(
            bind=self._engine,
            autocommit=False,
            autoflush=False,
        )
        logger.info("Conexión a MySQL inicializada correctamente.")

    @property
    def engine(self):
        return self._engine

    def get_session(self) -> Session:
        return self._session_factory()


def get_db():
    """
    Dependency de FastAPI para inyectar la sesión de base de datos.
    Se usa como parámetro en los controllers con Depends(get_db).
    """
    db = DatabaseSingleton().get_session()
    try:
        yield db
    finally:
        db.close()
