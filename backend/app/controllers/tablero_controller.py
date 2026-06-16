# app/controllers/tablero_controller.py
import logging
import bleach
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.config.database import get_db
from app.models.tablero import Tablero, Tarea
from app.models.usuario import Usuario

router = APIRouter(prefix="/tableros", tags=["Tableros Kanban"])
logger = logging.getLogger(__name__)


class TableroCreate(BaseModel):
    nombre: str


class TareaCreate(BaseModel):
    contenido: str
    seccion:   str = "por_hacer"


class TareaUpdate(BaseModel):
    contenido: Optional[str] = None
    seccion:   Optional[str] = None


@router.get("/vendedor/{vendedor_id}")
def listar_tableros(vendedor_id: str, db: Session = Depends(get_db)):
    tableros = db.query(Tablero).filter(Tablero.usuario_id == vendedor_id).all()
    return [
        {
            "id":     t.id,
            "nombre": t.nombre,
            "tareas": [{"id": ta.id, "contenido": ta.contenido, "seccion": ta.seccion} for ta in t.tareas],
        }
        for t in tableros
    ]


@router.post("/vendedor/{vendedor_id}")
def crear_tablero(vendedor_id: str, datos: TableroCreate, db: Session = Depends(get_db)):
    vendedor = db.query(Usuario).filter(Usuario.id == vendedor_id).first()
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado.")

    total = db.query(Tablero).filter(Tablero.usuario_id == vendedor_id).count()
    if total >= vendedor.limite_tableros:
        raise HTTPException(status_code=400, detail=f"Límite de {vendedor.limite_tableros} tableros alcanzado.")

    tablero = Tablero(
        id         = str(uuid.uuid4()),
        usuario_id = vendedor_id,
        nombre     = bleach.clean(datos.nombre.strip()),
    )
    db.add(tablero)
    db.commit()
    db.refresh(tablero)
    logger.info(f"Tablero creado: {tablero.nombre}")
    return {"mensaje": "Tablero creado correctamente.", "id": tablero.id}


@router.delete("/{tablero_id}")
def eliminar_tablero(tablero_id: str, db: Session = Depends(get_db)):
    tablero = db.query(Tablero).filter(Tablero.id == tablero_id).first()
    if not tablero:
        raise HTTPException(status_code=404, detail="Tablero no encontrado.")
    db.delete(tablero)
    db.commit()
    return {"mensaje": "Tablero eliminado correctamente."}


@router.post("/{tablero_id}/tareas")
def crear_tarea(tablero_id: str, datos: TareaCreate, db: Session = Depends(get_db)):
    tablero = db.query(Tablero).filter(Tablero.id == tablero_id).first()
    if not tablero:
        raise HTTPException(status_code=404, detail="Tablero no encontrado.")

    tarea = Tarea(
        id         = str(uuid.uuid4()),
        tablero_id = tablero_id,
        contenido  = bleach.clean(datos.contenido.strip()),
        seccion    = datos.seccion,
    )
    db.add(tarea)
    db.commit()
    db.refresh(tarea)
    return {"mensaje": "Tarea creada correctamente.", "id": tarea.id}


@router.patch("/tareas/{tarea_id}")
def actualizar_tarea(tarea_id: str, datos: TareaUpdate, db: Session = Depends(get_db)):
    tarea = db.query(Tarea).filter(Tarea.id == tarea_id).first()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada.")
    if datos.contenido is not None: tarea.contenido = bleach.clean(datos.contenido.strip())
    if datos.seccion   is not None: tarea.seccion   = datos.seccion
    db.commit()
    return {"mensaje": "Tarea actualizada correctamente."}


@router.delete("/tareas/{tarea_id}")
def eliminar_tarea(tarea_id: str, db: Session = Depends(get_db)):
    tarea = db.query(Tarea).filter(Tarea.id == tarea_id).first()
    if not tarea:
        raise HTTPException(status_code=404, detail="Tarea no encontrada.")
    db.delete(tarea)
    db.commit()
    return {"mensaje": "Tarea eliminada correctamente."}
