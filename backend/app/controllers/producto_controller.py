# app/controllers/producto_controller.py
import logging
import bleach
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.producto import Producto, Variante
from app.schemas.producto_schema import ProductoCreate, ProductoUpdate

router = APIRouter(prefix="/productos", tags=["Productos"])
logger = logging.getLogger(__name__)


@router.get("/vendedor/{vendedor_id}")
def listar_productos(vendedor_id: str, db: Session = Depends(get_db)):
    """Lista todos los productos de un vendedor."""
    productos = db.query(Producto).filter(Producto.usuario_id == vendedor_id).order_by(Producto.orden_visual).all()
    return [
        {
            "id":           p.id,
            "nombre":       p.nombre,
            "precio":       float(p.precio),
            "descripcion":  p.descripcion,
            "estado":       p.estado,
            "orden_visual": p.orden_visual,
            "variantes":    [{"id": v.id, "tipo": v.tipo, "valor": v.valor} for v in p.variantes],
            "imagenes":     [{"id": i.id, "url": i.url, "orden": i.orden} for i in sorted(p.imagenes, key=lambda x: x.orden)],
        }
        for p in productos
    ]


@router.post("/vendedor/{vendedor_id}")
def crear_producto(vendedor_id: str, datos: ProductoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo producto para un vendedor."""
    nombre      = bleach.clean(datos.nombre.strip())
    descripcion = bleach.clean(datos.descripcion.strip()) if datos.descripcion else None

    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre del producto es obligatorio.")

    nuevo = Producto(
        id         = str(uuid.uuid4()),
        usuario_id = vendedor_id,
        nombre     = nombre,
        descripcion= descripcion,
        precio     = datos.precio,
    )
    db.add(nuevo)
    db.flush()

    for v in datos.variantes or []:
        db.add(Variante(
            id          = str(uuid.uuid4()),
            producto_id = nuevo.id,
            tipo        = bleach.clean(v.tipo.strip()),
            valor       = bleach.clean(v.valor.strip()),
        ))

    db.commit()
    db.refresh(nuevo)
    logger.info(f"Producto creado: {nombre}")
    return {"mensaje": "Producto creado correctamente.", "id": nuevo.id}


@router.patch("/{producto_id}")
def editar_producto(producto_id: str, datos: ProductoUpdate, db: Session = Depends(get_db)):
    """Edita un producto existente."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")

    if datos.nombre      is not None: producto.nombre      = bleach.clean(datos.nombre.strip())
    if datos.precio      is not None: producto.precio      = datos.precio
    if datos.descripcion is not None: producto.descripcion = bleach.clean(datos.descripcion.strip())
    if datos.estado      is not None: producto.estado      = datos.estado
    if datos.orden_visual is not None: producto.orden_visual = datos.orden_visual

    db.commit()
    db.refresh(producto)
    return {"mensaje": "Producto actualizado correctamente."}


@router.delete("/{producto_id}")
def eliminar_producto(producto_id: str, db: Session = Depends(get_db)):
    """Elimina un producto y sus variantes e imágenes."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado.")
    db.delete(producto)
    db.commit()
    logger.info(f"Producto eliminado: {producto_id}")
    return {"mensaje": "Producto eliminado correctamente."}
