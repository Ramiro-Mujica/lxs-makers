# app/controllers/catalogo_controller.py
# Endpoints públicos: catálogo por código
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.usuario import Usuario
from app.models.producto import Producto

router = APIRouter(prefix="/catalogo", tags=["Catálogo Público"])
logger = logging.getLogger(__name__)


@router.get("/{codigo_catalogo}")
def ver_catalogo(codigo_catalogo: str, db: Session = Depends(get_db)):
    """Muestra el catálogo de una tienda por su código. No requiere autenticación."""
    vendedor = db.query(Usuario).filter(
        Usuario.codigo_catalogo == codigo_catalogo.upper(),
        Usuario.estado          == "activo",
        Usuario.rol             == "vendedor",
    ).first()

    if not vendedor:
        raise HTTPException(status_code=404, detail="Tienda no encontrada.")

    productos = db.query(Producto).filter(
        Producto.usuario_id == vendedor.id,
        Producto.estado     == "visible",
    ).order_by(Producto.orden_visual).all()

    return {
        "tienda": {
            "nombre_negocio":  vendedor.nombre_negocio,
            "whatsapp":        vendedor.whatsapp,
            "codigo_catalogo": vendedor.codigo_catalogo,
        },
        "productos": [
            {
                "id":          p.id,
                "nombre":      p.nombre,
                "precio":      float(p.precio),
                "descripcion": p.descripcion,
                "imagenes":    [{"url": i.url, "orden": i.orden} for i in sorted(p.imagenes, key=lambda x: x.orden)],
                "variantes":   [{"tipo": v.tipo, "valor": v.valor} for v in p.variantes],
            }
            for p in productos
        ],
    }
