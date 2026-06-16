# app/controllers/admin_controller.py
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.usuario import Usuario
from app.utils.codigo_generator import generar_codigo_unico

router = APIRouter(prefix="/admin", tags=["Administrador"])
logger = logging.getLogger(__name__)


@router.get("/vendedores")
def listar_vendedores(db: Session = Depends(get_db)):
    """Lista todos los vendedores con su estado y código de catálogo."""
    vendedores = db.query(Usuario).filter(Usuario.rol == "vendedor").all()
    return [
        {
            "id":              v.id,
            "email":           v.email,
            "nombre_negocio":  v.nombre_negocio,
            "whatsapp":        v.whatsapp,
            "estado":          v.estado,
            "codigo_catalogo": v.codigo_catalogo,
            "limite_tableros": v.limite_tableros,
            "created_at":      v.created_at,
        }
        for v in vendedores
    ]


@router.patch("/vendedores/{vendedor_id}/aprobar")
def aprobar_vendedor(vendedor_id: str, db: Session = Depends(get_db)):
    """Aprueba un vendedor y genera su código de catálogo único."""
    vendedor = db.query(Usuario).filter(Usuario.id == vendedor_id, Usuario.rol == "vendedor").first()
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado.")
    if vendedor.estado == "activo":
        raise HTTPException(status_code=400, detail="El vendedor ya está activo.")

    codigo                   = generar_codigo_unico(db, Usuario, "codigo_catalogo")
    vendedor.estado          = "activo"
    vendedor.codigo_catalogo = codigo
    db.commit()
    db.refresh(vendedor)
    logger.info(f"Vendedor aprobado: {vendedor.email} — código: {codigo}")
    return {"mensaje": "Vendedor aprobado correctamente.", "codigo_catalogo": codigo}


@router.patch("/vendedores/{vendedor_id}/deshabilitar")
def deshabilitar_vendedor(vendedor_id: str, db: Session = Depends(get_db)):
    """Deshabilita un vendedor activo."""
    vendedor = db.query(Usuario).filter(Usuario.id == vendedor_id, Usuario.rol == "vendedor").first()
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado.")
    if vendedor.estado == "deshabilitado":
        raise HTTPException(status_code=400, detail="El vendedor ya está deshabilitado.")

    vendedor.estado = "deshabilitado"
    db.commit()
    logger.info(f"Vendedor deshabilitado: {vendedor.email}")
    return {"mensaje": "Vendedor deshabilitado correctamente."}


@router.patch("/vendedores/{vendedor_id}/limite-tableros")
def ajustar_limite_tableros(vendedor_id: str, limite: int, db: Session = Depends(get_db)):
    """Ajusta el límite de tableros Kanban de un vendedor."""
    if limite < 1:
        raise HTTPException(status_code=400, detail="El límite debe ser mayor a 0.")
    vendedor = db.query(Usuario).filter(Usuario.id == vendedor_id, Usuario.rol == "vendedor").first()
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado.")

    vendedor.limite_tableros = limite
    db.commit()
    logger.info(f"Límite de tableros actualizado: {vendedor.email} — {limite}")
    return {"mensaje": f"Límite actualizado a {limite} tableros."}


@router.get("/estadisticas")
def estadisticas_globales(db: Session = Depends(get_db)):
    """Devuelve estadísticas globales del sistema."""
    return {
        "total_vendedores":       db.query(Usuario).filter(Usuario.rol == "vendedor").count(),
        "vendedores_activos":     db.query(Usuario).filter(Usuario.rol == "vendedor", Usuario.estado == "activo").count(),
        "vendedores_pendientes":  db.query(Usuario).filter(Usuario.rol == "vendedor", Usuario.estado == "pendiente").count(),
    }
