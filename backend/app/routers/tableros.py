import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tablero import Tablero, Tarea
from app.models.usuario import Usuario
from app.schemas.tablero import (
    TableroSchema,
    TableroCreateSchema,
    TableroUpdateSchema,
    TareaSchema,
    TareaCreateSchema,
    TareaUpdateSchema,
)
from app.security.auth import obtener_usuario_actual

logger = logging.getLogger(__name__)
router = APIRouter()


def _obtener_tablero_del_vendedor(tablero_id: UUID, usuario: Usuario, db: Session) -> Tablero:
    tablero = (
        db.query(Tablero)
        .filter(Tablero.id == tablero_id, Tablero.vendedor_id == usuario.id)
        .first()
    )
    if not tablero:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tablero no encontrado.")
    return tablero


@router.get("/", response_model=List[TableroSchema])
def listar_tableros(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return db.query(Tablero).filter(Tablero.vendedor_id == usuario.id).order_by(Tablero.created_at).all()


@router.post("/", response_model=TableroSchema, status_code=status.HTTP_201_CREATED)
def crear_tablero(
    datos: TableroCreateSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    total = db.query(Tablero).filter(Tablero.vendedor_id == usuario.id).count()
    if total >= usuario.limite_tableros:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Límite de {usuario.limite_tableros} tableros alcanzado.",
        )

    tablero = Tablero(vendedor_id=usuario.id, **datos.model_dump())
    db.add(tablero)
    db.commit()
    db.refresh(tablero)
    logger.info(f"Tablero creado por {usuario.email}: {tablero.nombre}")
    return tablero


@router.get("/{tablero_id}", response_model=TableroSchema)
def ver_tablero(
    tablero_id: UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    return _obtener_tablero_del_vendedor(tablero_id, usuario, db)


@router.patch("/{tablero_id}", response_model=TableroSchema)
def actualizar_tablero(
    tablero_id: UUID,
    datos: TableroUpdateSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    tablero = _obtener_tablero_del_vendedor(tablero_id, usuario, db)
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(tablero, campo, valor)
    db.commit()
    db.refresh(tablero)
    return tablero


@router.delete("/{tablero_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_tablero(
    tablero_id: UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    tablero = _obtener_tablero_del_vendedor(tablero_id, usuario, db)
    db.delete(tablero)
    db.commit()
    logger.info(f"Tablero eliminado por {usuario.email}")


@router.post("/{tablero_id}/tareas", response_model=TareaSchema, status_code=status.HTTP_201_CREATED)
def agregar_tarea(
    tablero_id: UUID,
    datos: TareaCreateSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    tablero = _obtener_tablero_del_vendedor(tablero_id, usuario, db)
    tarea = Tarea(tablero_id=tablero.id, **datos.model_dump())
    db.add(tarea)
    db.commit()
    db.refresh(tarea)
    return tarea


@router.patch("/{tablero_id}/tareas/{tarea_id}", response_model=TareaSchema)
def actualizar_tarea(
    tablero_id: UUID,
    tarea_id: UUID,
    datos: TareaUpdateSchema,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    tablero = _obtener_tablero_del_vendedor(tablero_id, usuario, db)
    tarea = db.query(Tarea).filter(Tarea.id == tarea_id, Tarea.tablero_id == tablero.id).first()
    if not tarea:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontrado.")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(tarea, campo, valor)
    db.commit()
    db.refresh(tarea)
    return tarea


@router.delete("/{tablero_id}/tareas/{tarea_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_tarea(
    tablero_id: UUID,
    tarea_id: UUID,
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    tablero = _obtener_tablero_del_vendedor(tablero_id, usuario, db)
    tarea = db.query(Tarea).filter(Tarea.id == tarea_id, Tarea.tablero_id == tablero.id).first()
    if not tarea:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontrado.")

    db.delete(tarea)
    db.commit()