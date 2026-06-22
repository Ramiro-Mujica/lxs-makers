    import { useState, useEffect } from 'react'
    import { Link } from 'react-router-dom'
    import { useAuth } from '../context/AuthContext'
    import { usuariosService } from '../services/api'
    import SidebarAdmin from '../components/SidebarAdmin'
    import SidebarVendedor from '../components/SidebarVendedor'
    import '../styles/dashboard.css'

    function Dashboard() {
    const { usuario }                   = useAuth()
    const esAdmin                       = usuario?.rol === 'administrador'
    const [resumen, setResumen]         = useState(null)
    const [resumenAdmin, setResumenAdmin] = useState(null)
    const [copiado, setCopiado]         = useState(false)

    useEffect(() => {
        if (!esAdmin) {
        usuariosService.resumen().then(res => setResumen(res.data)).catch(() => {})
        } else {
        usuariosService.listarVendedores().then(res => {
            const vendedores = res.data
            setResumenAdmin({
            activos:    vendedores.filter(v => v.estado === 'activo').length,
            pendientes: vendedores.filter(v => v.estado === 'pendiente').length,
            })
        }).catch(() => {})
        }
    }, [esAdmin])

    const copiarLink = () => {
        if (!resumen?.codigo_catalogo) return
        const link = `${window.location.origin}/catalogo/${resumen.codigo_catalogo}`
        navigator.clipboard.writeText(link)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 3000)
    }

    return (
        <div className="dashboard-wrapper">
        {esAdmin ? <SidebarAdmin /> : <SidebarVendedor />}

        <div className="main-content">
            <div className="topbar">
            <span className="topbar-title">
                {esAdmin ? 'Panel Administrador' : `Hola, ${resumen?.nombre_negocio || 'vendedor'}`}
            </span>
            <div className="topbar-user">
                <span>{esAdmin ? 'Administrador' : 'Vendedor'}</span>
            </div>
            </div>

            <div className="content-area">
            {esAdmin ? (
                <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-info">
                    <h3>{resumenAdmin?.activos || 0}</h3>
                    <p>Vendedores activos</p>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-card-info">
                    <h3>{resumenAdmin?.pendientes || 0}</h3>
                    <p>Pendientes de aprobación</p>
                    </div>
                </div>
                </div>
            ) : (
                <>
                {resumen?.codigo_catalogo && (
                    <div className="card card-mb dashboard-catalogo">
                    <div className="dashboard-catalogo-info">
                        <span className="perfil-label">Tu código de catálogo</span>
                        <span className="codigo-catalogo">{resumen.codigo_catalogo}</span>
                        <span className="text-muted">Compartilo con tus clientes para que vean tus productos</span>
                    </div>
                    <button className="btn btn-success" onClick={copiarLink}>
                        {copiado ? '¡Link copiado!' : 'Copiar link del catálogo'}
                    </button>
                    </div>
                )}

                <div className="stats-grid">
                    <div className="stat-card warning">
                    <div className="stat-card-info">
                        <h3>{resumen?.pedidos_pendientes || 0}</h3>
                        <p>Pedidos pendientes</p>
                    </div>
                    </div>
                    <div className="stat-card info">
                    <div className="stat-card-info">
                        <h3>{resumen?.pedidos_en_proceso || 0}</h3>
                        <p>En proceso</p>
                    </div>
                    </div>
                    <div className="stat-card">
                    <div className="stat-card-info">
                        <h3>{resumen?.pedidos_enviados || 0}</h3>
                        <p>Enviados</p>
                    </div>
                    </div>
                    <div className="stat-card success">
                    <div className="stat-card-info">
                        <h3>{resumen?.pedidos_completados || 0}</h3>
                        <p>Completados</p>
                    </div>
                    </div>
                </div>

                <div className="stats-grid">
                    <div className="stat-card success">
                    <div className="stat-card-info">
                        <h3>{resumen?.productos_visibles || 0}</h3>
                        <p>Productos visibles</p>
                    </div>
                    </div>
                    <div className="stat-card warning">
                    <div className="stat-card-info">
                        <h3>{resumen?.productos_sin_stock || 0}</h3>
                        <p>Sin stock</p>
                    </div>
                    </div>
                    <div className="stat-card danger">
                    <div className="stat-card-info">
                        <h3>{resumen?.productos_ocultos || 0}</h3>
                        <p>Ocultos</p>
                    </div>
                    </div>
                </div>

                <div className="dashboard-guia">
                    <div className="card-header">Guía rápida</div>
                    <div className="guia-grid">
                    <Link to="/vendedor/productos" className="guia-item">
                        <span className="guia-icono">📦</span>
                        <div>
                        <strong>Productos</strong>
                        <p>Cargá tu catálogo con fotos, precios y variantes de talle o color.</p>
                        </div>
                    </Link>
                    <Link to="/vendedor/pedidos" className="guia-item">
                        <span className="guia-icono">📋</span>
                        <div>
                        <strong>Pedidos</strong>
                        <p>Registrá los pedidos de tus clientes y seguí su estado hasta la entrega.</p>
                        </div>
                    </Link>
                    <Link to="/vendedor/estadisticas" className="guia-item">
                        <span className="guia-icono">📊</span>
                        <div>
                        <strong>Estadísticas</strong>
                        <p>Mirá tus ganancias diarias, semanales y los productos más vendidos.</p>
                        </div>
                    </Link>
                    <Link to="/vendedor/tableros" className="guia-item">
                        <span className="guia-icono">📌</span>
                        <div>
                        <strong>Tableros</strong>
                        <p>Organizá tus tareas pendientes con columnas Kanban arrastrables.</p>
                        </div>
                    </Link>
                    <Link to="/vendedor/perfil" className="guia-item">
                        <span className="guia-icono">👤</span>
                        <div>
                        <strong>Mi perfil</strong>
                        <p>Editá el nombre de tu negocio, WhatsApp y compartí tu catálogo.</p>
                        </div>
                    </Link>
                    </div>
                </div>
                </>
            )}
            </div>
        </div>
        </div>
    )
    }

    export default Dashboard