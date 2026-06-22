from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import bcrypt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.usuario import Usuario

ALGORITMO = "HS256"
MINUTOS_ACCESS_TOKEN = 480
DIAS_REFRESH_TOKEN = 7      

esquema_bearer = HTTPBearer()

def hashear_password(password: str) -> str:
    """Convierte una contraseña en texto plano a su versión hasheada para guardar en la base."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verificar_password(password_plano: str, password_hash: str) -> bool:
    """Compara una contraseña ingresada contra el hash guardado."""
    return bcrypt.checkpw(password_plano.encode("utf-8"), password_hash.encode("utf-8"))


def crear_token(datos: dict, expira_en: timedelta, tipo: str) -> str:
    """Genera un JWT firmado, distinguiendo si es de tipo 'access' o 'refresh'."""
    payload = datos.copy()
    payload.update({
        "exp": datetime.now(timezone.utc) + expira_en,
        "tipo": tipo,
    })
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITMO)


def generar_tokens(usuario: Usuario) -> dict:
    """Genera el par access + refresh para un usuario que acaba de loguearse."""
    datos = {"sub": str(usuario.id), "rol": usuario.rol, "estado": usuario.estado}
    return {
        "access": crear_token(datos, timedelta(minutes=MINUTOS_ACCESS_TOKEN), "access"),
        "refresh": crear_token(datos, timedelta(days=DIAS_REFRESH_TOKEN), "refresh"),
    }


def renovar_access_token(refresh_token: str) -> str:
    """A partir de un refresh token válido, genera un nuevo access token."""
    error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token inválido o expirado.")
    try:
        payload = jwt.decode(refresh_token, settings.secret_key, algorithms=[ALGORITMO])
        if payload.get("tipo") != "refresh":
            raise error
    except JWTError:
        raise error

    datos = {"sub": payload["sub"], "rol": payload["rol"], "estado": payload["estado"]}
    return crear_token(datos, timedelta(minutes=MINUTOS_ACCESS_TOKEN), "access")


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(esquema_bearer),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Reemplaza a 'permission_classes([IsAuthenticated])' de DRF:
    valida el token recibido y devuelve el usuario logueado.
    Si el token no es válido, corta la petición con 401 automáticamente.
    """
    token = credenciales.credentials

    error = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Credenciales inválidas o token expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITMO])
        if payload.get("tipo") != "access":
            raise error
        usuario_id = payload.get("sub")
        if usuario_id is None:
            raise error
    except JWTError:
        raise error

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if usuario is None:
        raise error
    return usuario


def requerir_administrador(usuario: Usuario = Depends(obtener_usuario_actual)) -> Usuario:
    """Reemplaza al chequeo manual 'if request.user.rol != administrador' que repetías en varias vistas."""
    if usuario.rol != "administrador":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Sin permisos.")
    return usuario