import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.pedido import Pedido, DetallePedido, EstadisticaVendedor
from app.models.usuario import Usuario
from app.security.auth import obtener_usuario_actual, requerir_administrador

logger = logging.getLogger(__name__)
router = APIRouter()

DIAS_GRAFICO_DIARIO = 30
SEMANAS_GRAFICO = 8
MESES_GRAFICO = 2
TOP_PRODUCTOS = 5


class ReiniciarAdminSchema(BaseModel):
    vendedor_id: UUID


def _obtener_o_crear_estadistica(usuario: Usuario, db: Session) -> EstadisticaVendedor:
    estadistica = db.query(EstadisticaVendedor).filter(EstadisticaVendedor.vendedor_id == usuario.id).first()
    if not estadistica:
        estadistica = EstadisticaVendedor(vendedor_id=usuario.id)
        db.add(estadistica)
        db.commit()
        db.refresh(estadistica)

    if estadistica.debe_reiniciar():
        estadistica.inicio_periodo = datetime.now(timezone.utc)
        db.commit()
        logger.info(f"Estadísticas reiniciadas automáticamente para {usuario.email}")

    return estadistica


def _detalles_completados(vendedor_id, desde, db: Session):
    return (
        db.query(DetallePedido)
        .join(Pedido, DetallePedido.pedido_id == Pedido.id)
        .filter(
            Pedido.vendedor_id == vendedor_id,
            Pedido.estado == "completado",
            Pedido.completado_at >= desde,
        )
    )


def _ganancia_ingresos(query):
    """Suma ganancia e ingresos de un conjunto de detalles de pedido."""
    ganancia = 0
    ingresos = 0
    for d in query.all():
        ganancia += d.ganancia()
        ingresos += d.subtotal()
    return float(ganancia), float(ingresos)


@router.get("/estadisticas")
def estadisticas_vendedor(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    estadistica = _obtener_o_crear_estadistica(usuario, db)
    desde = estadistica.inicio_periodo
    ahora = datetime.now(timezone.utc)

    detalles_base = _detalles_completados(usuario.id, desde, db)

    ganancia_diaria = []
    for i in range(DIAS_GRAFICO_DIARIO - 1, -1, -1):
        dia = (ahora - timedelta(days=i)).date()
        dia_desde = datetime.combine(dia, datetime.min.time(), tzinfo=timezone.utc)
        dia_hasta = datetime.combine(dia, datetime.max.time(), tzinfo=timezone.utc)
        query_dia = detalles_base.filter(Pedido.completado_at.between(dia_desde, dia_hasta))
        ganancia, ingresos = _ganancia_ingresos(query_dia)
        ganancia_diaria.append({"fecha": dia.strftime("%d/%m"), "ganancia": ganancia, "ingresos": ingresos})

    ganancia_semanal = []
    for i in range(SEMANAS_GRAFICO - 1, -1, -1):
        semana_hasta = ahora - timedelta(weeks=i)
        semana_desde = semana_hasta - timedelta(weeks=1)
        query_semana = detalles_base.filter(Pedido.completado_at.between(semana_desde, semana_hasta))
        ganancia, ingresos = _ganancia_ingresos(query_semana)
        ganancia_semanal.append({"semana": f"S{SEMANAS_GRAFICO - i}", "ganancia": ganancia, "ingresos": ingresos})

    ganancia_mensual = []
    for i in range(MESES_GRAFICO - 1, -1, -1):
        mes_hasta = ahora - timedelta(days=30 * i)
        mes_desde = mes_hasta - timedelta(days=30)
        query_mes = detalles_base.filter(Pedido.completado_at.between(mes_desde, mes_hasta))
        ganancia, ingresos = _ganancia_ingresos(query_mes)
        ganancia_mensual.append({"mes": mes_desde.strftime("%b %Y"), "ganancia": ganancia, "ingresos": ingresos})

    todos_los_detalles = detalles_base.all()

    resumen_por_producto = {}
    for d in todos_los_detalles:
        if d.nombre_producto not in resumen_por_producto:
            resumen_por_producto[d.nombre_producto] = {"vendido": 0, "ganancia": 0.0}
        resumen_por_producto[d.nombre_producto]["vendido"] += d.cantidad
        resumen_por_producto[d.nombre_producto]["ganancia"] += float(d.ganancia())

    top_vendidos = sorted(
        ({"nombre_producto": k, "total_vendido": v["vendido"]} for k, v in resumen_por_producto.items()),
        key=lambda x: x["total_vendido"],
        reverse=True,
    )[:TOP_PRODUCTOS]

    top_ganancia = sorted(
        ({"nombre_producto": k, "total_ganancia": v["ganancia"]} for k, v in resumen_por_producto.items()),
        key=lambda x: x["total_ganancia"],
        reverse=True,
    )[:TOP_PRODUCTOS]

    ganancia_total, ingresos_total = _ganancia_ingresos(detalles_base)
    pedidos_completados = sum(d.cantidad for d in todos_los_detalles)

    return {
        "ganancia_diaria": ganancia_diaria,
        "ganancia_semanal": ganancia_semanal,
        "ganancia_mensual": ganancia_mensual,
        "top_vendidos": top_vendidos,
        "top_ganancia": top_ganancia,
        "ganancia_total": ganancia_total,
        "ingresos_total": ingresos_total,
        "pedidos_completados": pedidos_completados,
        "inicio_periodo": estadistica.inicio_periodo,
    }


@router.post("/estadisticas/reiniciar")
def reiniciar_estadisticas(
    usuario: Usuario = Depends(obtener_usuario_actual),
    db: Session = Depends(get_db),
):
    estadistica = db.query(EstadisticaVendedor).filter(EstadisticaVendedor.vendedor_id == usuario.id).first()
    if not estadistica:
        estadistica = EstadisticaVendedor(vendedor_id=usuario.id)
        db.add(estadistica)

    estadistica.inicio_periodo = datetime.now(timezone.utc)
    db.commit()
    logger.info(f"Estadísticas reiniciadas manualmente por {usuario.email}")
    return {"mensaje": "Estadísticas reiniciadas correctamente."}


@router.get("/estadisticas/admin")
def estadisticas_admin(
    _admin: Usuario = Depends(requerir_administrador),
    db: Session = Depends(get_db),
):
    vendedores = db.query(Usuario).filter(Usuario.rol == "vendedor", Usuario.estado == "activo").all()

    resultado = []
    for v in vendedores:
        total = (
            db.query(Pedido)
            .filter(Pedido.vendedor_id == v.id, Pedido.estado == "completado")
            .count()
        )
        resultado.append({
            "vendedor": v.email,
            "nombre_negocio": v.nombre_negocio or "-",
            "pedidos_completados": total,
        })

    return resultado


@router.post("/estadisticas/admin/reiniciar")
def reiniciar_contador_admin(
    datos: ReiniciarAdminSchema,
    admin: Usuario = Depends(requerir_administrador),
    db: Session = Depends(get_db),
):
    db.query(Pedido).filter(
        Pedido.vendedor_id == datos.vendedor_id, Pedido.estado == "completado"
    ).update({Pedido.estado: "archivado"})
    db.commit()
    logger.info(f"Contador admin reiniciado por {admin.email}")
    return {"mensaje": "Contador reiniciado."}