# app/controllers/imagen_controller.py
import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.producto import Producto, ImagenProducto
from app.services.imagen_service import subir_imagen, LIMITE_IMAGENES

router = APIRouter(prefix="/imagenes", tags=["Imágenes"])
logger = logging.getLogger(__name__)

TIPOS_PERMITIDOS = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/producto/{producto_id}")
async def subir_imagen_producto(
    producto_id: str,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Sube una imagen a Cloudinary y la asocia al producto."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")

    if len(producto.imagenes) >= LIMITE_IMAGENES:
        raise HTTPException(status_code=400, detail=f"Límite de {LIMITE_IMAGENES} imágenes alcanzado.")

    if archivo.content_type not in TIPOS_PERMITIDOS:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido.")

    contenido    = await archivo.read()
    nombre       = f"{producto_id}_{uuid.uuid4().hex[:8]}"
    url          = subir_imagen(contenido, nombre)

    nueva_imagen = ImagenProducto(
        id          = str(uuid.uuid4()),
        producto_id = producto_id,
        url         = url,
        orden       = len(producto.imagenes),
    )
    db.add(nueva_imagen)
    db.commit()
    db.refresh(nueva_imagen)
    logger.info(f"Imagen subida para producto {producto_id}")
    return {"mensaje": "Imagen subida correctamente.", "url": url, "id": nueva_imagen.id}


@router.delete("/{imagen_id}")
def eliminar_imagen_producto(imagen_id: str, db: Session = Depends(get_db)):
    """Elimina una imagen del producto."""
    imagen = db.query(ImagenProducto).filter(ImagenProducto.id == imagen_id).first()
    if not imagen:
        raise HTTPException(status_code=404, detail="Imagen no encontrada.")
    db.delete(imagen)
    db.commit()
    return {"mensaje": "Imagen eliminada correctamente."}


@router.patch("/orden/{producto_id}")
def actualizar_orden_imagenes(producto_id: str, ordenes: list[dict], db: Session = Depends(get_db)):
    """Actualiza el orden de las imágenes de un producto."""
    for item in ordenes:
        imagen = db.query(ImagenProducto).filter(
            ImagenProducto.id == item["id"],
            ImagenProducto.producto_id == producto_id,
        ).first()
        if imagen:
            imagen.orden = item["orden"]
    db.commit()
    return {"mensaje": "Orden actualizado correctamente."}
