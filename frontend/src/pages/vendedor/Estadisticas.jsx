    import { useState, useEffect } from 'react'
    import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
    } from 'recharts'
    import { estadisticasService } from '../../services/api'
    import SidebarVendedor from '../../components/SidebarVendedor'
    import '../../styles/dashboard.css'
    import '../../styles/estadisticas.css'

    const formatPesos = (valor) => `$${Number(valor).toLocaleString('es-AR')}`

    const TooltipPersonalizado = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="tooltip-custom">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
            {p.name}: {formatPesos(p.value)}
            </p>
        ))}
        </div>
    )
    }

    function Estadisticas() {
    const [datos, setDatos]         = useState(null)
    const [cargando, setCargando]   = useState(true)
    const [error, setError]         = useState('')
    const [vista, setVista]         = useState('diaria')
    const [reiniciando, setReiniciando] = useState(false)

    const cargarEstadisticas = async () => {
        try {
        const res = await estadisticasService.obtener()
        setDatos(res.data)
        } catch {
        setError('Error al cargar estadísticas.')
        } finally {
        setCargando(false)
        }
    }

    useEffect(() => { cargarEstadisticas() }, [])

    const handleReiniciar = async () => {
        if (!window.confirm('¿Reiniciar estadísticas? Se perderán todos los datos del período actual.')) return
        setReiniciando(true)
        try {
        await estadisticasService.reiniciar()
        cargarEstadisticas()
        } catch {
        setError('Error al reiniciar.')
        } finally {
        setReiniciando(false)
        }
    }

    const datosGrafica = {
        diaria:   datos?.ganancia_diaria   || [],
        semanal:  datos?.ganancia_semanal  || [],
        mensual:  datos?.ganancia_mensual  || [],
    }

    const claveX = { diaria: 'fecha', semanal: 'semana', mensual: 'mes' }

    if (cargando) return (
        <div className="dashboard-wrapper">
        <SidebarVendedor />
        <div className="main-content">
            <div className="topbar"><span className="topbar-title">Estadísticas</span></div>
            <div className="content-area"><p>Cargando...</p></div>
        </div>
        </div>
    )

    return (
        <div className="dashboard-wrapper">
        <SidebarVendedor />

        <div className="main-content">
            <div className="topbar">
            <span className="topbar-title">Estadísticas</span>
            <div className="topbar-user">
                <button className="btn btn-danger" onClick={handleReiniciar} disabled={reiniciando}>
                {reiniciando ? 'Reiniciando...' : 'Reiniciar período'}
                </button>
            </div>
            </div>

            <div className="content-area">
            {error && <div className="auth-error">{error}</div>}

            <div className="stats-grid">
                <div className="stat-card success">
                <div className="stat-card-info">
                    <h3>{formatPesos(datos?.ganancia_total || 0)}</h3>
                    <p>Ganancia total del período</p>
                </div>
                </div>
                <div className="stat-card info">
                <div className="stat-card-info">
                    <h3>{formatPesos(datos?.ingresos_total || 0)}</h3>
                    <p>Ingresos totales</p>
                </div>
                </div>
                <div className="stat-card warning">
                <div className="stat-card-info">
                    <h3>{datos?.pedidos_completados || 0}</h3>
                    <p>Unidades vendidas</p>
                </div>
                </div>
            </div>

            <div className="card card-mb">
                <div className="card-header">
                <span>Evolución de ganancias</span>
                <div className="vista-selector">
                    {['diaria', 'semanal', 'mensual'].map(v => (
                    <button
                        key={v}
                        className={`btn ${vista === v ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setVista(v)}
                    >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                    ))}
                </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={datosGrafica[vista]} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                    <defs>
                    <linearGradient id="gradGanancia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1cc88a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1cc88a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4e73df" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4e73df" stopOpacity={0} />
                    </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey={claveX[vista]} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={v => `$${v.toLocaleString('es-AR')}`} tick={{ fontSize: 12 }} />
                    <Tooltip content={<TooltipPersonalizado />} />
                    <Legend />
                    <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#4e73df" fill="url(#gradIngresos)" strokeWidth={2} />
                    <Area type="monotone" dataKey="ganancia" name="Ganancia" stroke="#1cc88a" fill="url(#gradGanancia)" strokeWidth={2} />
                </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="estadisticas-grid">
                <div className="card">
                <div className="card-header">Productos más vendidos</div>
                {datos?.top_vendidos?.length === 0 ? (
                    <p className="text-muted">Sin datos aún.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={datos?.top_vendidos} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="nombre_producto" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="total_vendido" name="Unidades" fill="#4e73df" radius={[4,4,0,0]} />
                    </BarChart>
                    </ResponsiveContainer>
                )}
                </div>

                <div className="card">
                <div className="card-header">Productos con mayor ganancia</div>
                {datos?.top_ganancia?.length === 0 ? (
                    <p className="text-muted">Sin datos aún.</p>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={datos?.top_ganancia} margin={{ top: 10, right: 10, left: 20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="nombre_producto" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                        <YAxis tickFormatter={v => `$${v.toLocaleString('es-AR')}`} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={v => formatPesos(v)} />
                        <Bar dataKey="total_ganancia" name="Ganancia" fill="#1cc88a" radius={[4,4,0,0]} />
                    </BarChart>
                    </ResponsiveContainer>
                )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">Período activo</div>
                <p className="text-muted">
                Las estadísticas se reinician automáticamente cada 2 meses.
                Período actual desde: <strong>{new Date(datos?.inicio_periodo).toLocaleDateString('es-AR')}</strong>
                </p>
            </div>

            </div>
        </div>
        </div>
    )
    }

    export default Estadisticas