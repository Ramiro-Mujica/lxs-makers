import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.producto import Producto, Variante
from app.models.usuario import Usuario
from app.schemas.producto import (
    ProductoPublicoSchema,
    ProductoVendedorSchema,
    ProductoCreateSchema,
    ProductoUpdateSchema,
    VarianteSchema,
    VarianteCreateSchema,
)
from app.security.auth import obtener_usuario_actual

logger = logging.getLogger(__name__)
router = APIRouter()


def _obtener_producto_del_vendedor(producto_id: UUID, usuario: Usuario, db: Session) -> Producto:
    """Función de apoyo: busca un producto, asegurándose de que sea del vendedor logueado."""
    producto = (
        db.query(Producto)
        .filter(Producto.id == producto_id, Producto.vendedor_id == usuario.id)
        .first()
    )
    if not producto:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado.")
    return producto


@router.get("/", response_model=List[ProductoVendedorSchema])
def listar_productos(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return db.query(Producto).filter(Producto.vendedor_id == usuario.id).all()


@router.post("/", response_model=ProductoVendedorSchema, status_code=status.HTTP_201_CREATED)
def crear_producto(
    datos: ProductoCreateSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    producto = Producto(vendedor_id=usuario.id, **datos.model_dump())
    db.add(producto)
    db.commit()
    db.refresh(producto)
    logger.info(f"Producto creado por {usuario.email}")
    return producto


@router.get("/{producto_id}", response_model=ProductoVendedorSchema)
def ver_producto(
    producto_id: UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return _obtener_producto_del_vendedor(producto_id, usuario, db)


@router.patch("/{producto_id}", response_model=ProductoVendedorSchema)
def actualizar_producto(
    producto_id: UUID,
    datos: ProductoUpdateSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    producto = _obtener_producto_del_vendedor(producto_id, usuario, db)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(producto, campo, valor)
    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    producto_id: UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    producto = _obtener_producto_del_vendedor(producto_id, usuario, db)
    db.delete(producto)
    db.commit()
    logger.info(f"Producto eliminado por {usuario.email}")


@router.post("/{producto_id}/variantes", response_model=VarianteSchema, status_code=status.HTTP_201_CREATED)
def agregar_variante(
    producto_id: UUID,
    datos: VarianteCreateSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    producto = _obtener_producto_del_vendedor(producto_id, usuario, db)
    variante = Variante(producto_id=producto.id, **datos.model_dump())
    db.add(variante)
    db.commit()
    db.refresh(variante)
    return variante


@router.delete("/{producto_id}/variantes/{variante_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_variante(
    producto_id: UUID,
    variante_id: UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    producto = _obtener_producto_del_vendedor(producto_id, usuario, db)
    variante = (
        db.query(Variante)
        .filter(Variante.id == variante_id, Variante.producto_id == producto.id)
        .first()
    )
    if not variante:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Variante no encontrada.")
    db.delete(variante)
    db.commit()


@router.get("/catalogo/{codigo_catalogo}")
def catalogo_publico(codigo_catalogo: str, db: Session = Depends(get_db)):
    """Endpoint público — no requiere login. Lo usa el cliente final."""
    vendedor = (
        db.query(Usuario)
        .filter(Usuario.codigo_catalogo == codigo_catalogo, Usuario.estado == "activo")
        .first()
    )
    if not vendedor:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Catálogo no encontrado.")

    productos_visibles = (
        db.query(Producto)
        .filter(Producto.vendedor_id == vendedor.id, Producto.estado == "visible")
        .all()
    )

    return {
        "negocio": vendedor.nombre_negocio,
        "whatsapp": vendedor.whatsapp,
        "productos": [ProductoPublicoSchema.model_validate(p) for p in productos_visibles],
    }