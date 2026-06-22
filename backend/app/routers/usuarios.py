import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import (
    RegistroSchema,
    LoginSchema,
    UsuarioPerfilSchema,
    UsuarioPerfilUpdateSchema,
)
from app.security.auth import (
    hashear_password,
    verificar_password,
    generar_tokens,
    obtener_usuario_actual,
    requerir_administrador,
)
from app.utils.codigo_generator import generar_codigo_catalogo

logger = logging.getLogger(__name__)
router = APIRouter()


class CambiarEstadoSchema(BaseModel):
    """Cuerpo de la petición para que un admin cambie el estado de un vendedor."""
    estado: str


@router.post("/registro", status_code=status.HTTP_201_CREATED)
def registro(datos: RegistroSchema, db: Session = Depends(get_db)):
    existe = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if existe:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Ya existe una cuenta con ese email.")

    nuevo_usuario = Usuario(
        email=datos.email,
        password=hashear_password(datos.password),
        nombre_negocio=datos.nombre_negocio,
        whatsapp=datos.whatsapp,
        rol="vendedor",
        estado="pendiente",
    )
    db.add(nuevo_usuario)
    db.commit()
    logger.info(f"Nuevo vendedor registrado: {nuevo_usuario.email}")
    return {"mensaje": "Registro exitoso. Tu cuenta está pendiente de aprobación."}


@router.post("/login")
def login(datos: LoginSchema, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()

    if not usuario or not verificar_password(datos.password, usuario.password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email o contraseña incorrectos.")

    if usuario.estado == "pendiente":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tu cuenta está pendiente de aprobación por el administrador.")

    tokens = generar_tokens(usuario)
    logger.info(f"Login exitoso: {usuario.email}")
    return {
        **tokens,
        "rol": usuario.rol,
        "estado": usuario.estado,
        "id": str(usuario.id),
    }


@router.get("/perfil", response_model=UsuarioPerfilSchema)
def ver_perfil(usuario: Usuario = Depends(obtener_usuario_actual)):
    return usuario


@router.patch("/perfil")
def actualizar_perfil(
    datos: UsuarioPerfilUpdateSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(usuario, campo, valor)
    db.commit()
    logger.info(f"Perfil actualizado: {usuario.email}")
    return {"mensaje": "Perfil actualizado correctamente."}


@router.get("/vendedores", response_model=List[UsuarioPerfilSchema])
def listar_vendedores(
    _admin: Usuario = Depends(requerir_administrador),
    db: Session = Depends(get_db),
):
    return (
        db.query(Usuario)
        .filter(Usuario.rol == "vendedor")
        .order_by(Usuario.created_at.desc())
        .all()
    )


@router.patch("/vendedores/{usuario_id}/estado")
def cambiar_estado_vendedor(
    usuario_id: UUID,
    datos: CambiarEstadoSchema,
    _admin: Usuario = Depends(requerir_administrador),
    db: Session = Depends(get_db),
):
    estados_validos = ["activo", "deshabilitado", "pendiente"]
    if datos.estado not in estados_validos:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Estado inválido.")

    vendedor = (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id, Usuario.rol == "vendedor")
        .first()
    )
    if not vendedor:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Vendedor no encontrado.")

    if datos.estado == "activo" and not vendedor.codigo_catalogo:
        codigo = generar_codigo_catalogo()
        while db.query(Usuario).filter(Usuario.codigo_catalogo == codigo).first():
            codigo = generar_codigo_catalogo()
        vendedor.codigo_catalogo = codigo

    vendedor.estado = datos.estado
    db.commit()
    logger.info(f"Vendedor {vendedor.email} cambió a estado: {datos.estado}")
    return {"mensaje": f"Vendedor {datos.estado} correctamente."}