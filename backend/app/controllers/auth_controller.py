# app/controllers/auth_controller.py
import logging
import bleach
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario_schema import UsuarioCreate, LoginRequest, TokenResponse
from app.utils.auth_utils import hashear_password, verificar_password, crear_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Autenticación"])
logger = logging.getLogger(__name__)


class PerfilUpdate(BaseModel):
    nombre_negocio: Optional[str] = None
    descripcion:    Optional[str] = None
    whatsapp:       Optional[str] = None


@router.post("/registro")
def registro(datos: UsuarioCreate, db: Session = Depends(get_db)):
    email          = bleach.clean(datos.email.strip().lower())
    nombre_negocio = bleach.clean(datos.nombre_negocio.strip()) if datos.nombre_negocio else None
    whatsapp       = bleach.clean(datos.whatsapp.strip()) if datos.whatsapp else None

    existente = db.query(Usuario).filter(Usuario.email == email).first()
    if existente:
        raise HTTPException(status_code=400, detail="El email ya está registrado.")

    nuevo = Usuario(
        id             = str(uuid.uuid4()),
        email          = email,
        password       = hashear_password(datos.password),
        rol            = "vendedor",
        estado         = "pendiente",
        nombre_negocio = nombre_negocio,
        whatsapp       = whatsapp,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    logger.info(f"Nuevo vendedor registrado: {email}")
    return {"mensaje": "Registro exitoso. Tu cuenta está pendiente de aprobación."}


@router.post("/login", response_model=TokenResponse)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    email   = bleach.clean(datos.email.strip().lower())
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if not usuario or not verificar_password(datos.password, usuario.password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos.")

    if usuario.estado == "deshabilitado":
        raise HTTPException(status_code=403, detail="Tu cuenta está deshabilitada.")

    token = crear_token({"sub": usuario.id, "rol": usuario.rol, "estado": usuario.estado})
    logger.info(f"Login exitoso: {email}")
    return {
        "access_token": token,
        "token_type":   "bearer",
        "rol":          usuario.rol,
        "estado":       usuario.estado,
        "user_id":      usuario.id,
    }


@router.get("/perfil/{usuario_id}")
def obtener_perfil(usuario_id: str, db: Session = Depends(get_db)):
    """Obtiene el perfil del vendedor."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return {
        "id":              usuario.id,
        "email":           usuario.email,
        "nombre_negocio":  usuario.nombre_negocio,
        "descripcion":     usuario.descripcion,
        "whatsapp":        usuario.whatsapp,
        "codigo_catalogo": usuario.codigo_catalogo,
    }


@router.patch("/perfil/{usuario_id}")
def actualizar_perfil(usuario_id: str, datos: PerfilUpdate, db: Session = Depends(get_db)):
    """Actualiza el perfil del vendedor."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    if datos.nombre_negocio is not None:
        usuario.nombre_negocio = bleach.clean(datos.nombre_negocio.strip())
    if datos.descripcion is not None:
        usuario.descripcion = bleach.clean(datos.descripcion.strip())
    if datos.whatsapp is not None:
        usuario.whatsapp = bleach.clean(datos.whatsapp.strip())

    db.commit()
    db.refresh(usuario)
    logger.info(f"Perfil actualizado: {usuario.email}")
    return {"mensaje": "Perfil actualizado correctamente."}