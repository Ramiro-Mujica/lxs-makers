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

router = APIRouter(prefix="/auth", tags=["Autenticación"])
logger = logging.getLogger(__name__)


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
