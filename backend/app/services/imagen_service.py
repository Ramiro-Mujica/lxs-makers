# app/services/imagen_service.py
import cloudinary
import cloudinary.uploader
from app.config.settings import settings
import logging

logger        = logging.getLogger(__name__)
LIMITE_IMAGENES = 5

cloudinary.config(
    cloud_name = settings.CLOUDINARY_CLOUD_NAME,
    api_key    = settings.CLOUDINARY_API_KEY,
    api_secret = settings.CLOUDINARY_API_SECRET,
)


def subir_imagen(archivo_bytes: bytes, nombre: str) -> str:
    """Sube imagen a Cloudinary y la convierte a WebP. Retorna URL pública."""
    try:
        resultado = cloudinary.uploader.upload(
            archivo_bytes,
            public_id      = f"lxs_makers/productos/{nombre}",
            format         = "webp",
            transformation = [{"quality": "auto", "fetch_format": "webp"}],
        )
        logger.info(f"Imagen subida: {resultado['secure_url']}")
        return resultado["secure_url"]
    except Exception as e:
        logger.error(f"Error subiendo imagen: {e}")
        raise


def eliminar_imagen(public_id: str) -> None:
    """Elimina una imagen de Cloudinary."""
    try:
        cloudinary.uploader.destroy(public_id)
        logger.info(f"Imagen eliminada: {public_id}")
    except Exception as e:
        logger.error(f"Error eliminando imagen: {e}")
