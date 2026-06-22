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


@router.get("/resumen")
def resumen_vendedor(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    """Datos para el dashboard del vendedor: contadores de pedidos y productos."""
    from datetime import datetime, timedelta, timezone
    from app.models.pedido import Pedido
    from app.models.producto import Producto

    hace_7_dias = datetime.now(timezone.utc) - timedelta(days=7)

    pedidos_activos = db.query(Pedido).filter(
        Pedido.vendedor_id == usuario.id,
        Pedido.created_at >= hace_7_dias,
    )

    productos = db.query(Producto).filter(Producto.vendedor_id == usuario.id)

    return {
        "nombre_negocio": usuario.nombre_negocio or "-",
        "codigo_catalogo": usuario.codigo_catalogo,
        "whatsapp": usuario.whatsapp or "-",
        "pedidos_pendientes": pedidos_activos.filter(Pedido.estado == "pendiente").count(),
        "pedidos_en_proceso": pedidos_activos.filter(Pedido.estado == "en_proceso").count(),
        "pedidos_enviados": pedidos_activos.filter(Pedido.estado == "enviado").count(),
        "pedidos_completados": pedidos_activos.filter(Pedido.estado == "completado").count(),
        "total_productos": productos.count(),
        "productos_visibles": productos.filter(Producto.estado == "visible").count(),
        "productos_sin_stock": productos.filter(Producto.estado == "sin_stock").count(),
        "productos_ocultos": productos.filter(Producto.estado == "oculto").count(),
    }


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