    import { useState, useEffect } from 'react'
    import { usuariosService } from '../../services/api'
    import SidebarAdmin from '../../components/SidebarAdmin'
    import '../../styles/dashboard.css'

    function Vendedores() {
    const [vendedores, setVendedores] = useState([])
    const [cargando, setCargando]     = useState(true)
    const [error, setError]           = useState('')

    const cargarVendedores = async () => {
        try {
        const res = await usuariosService.listarVendedores()
        setVendedores(res.data)
        } catch {
        setError('Error al cargar vendedores.')
        } finally {
        setCargando(false)
        }
    }

    useEffect(() => {
        cargarVendedores()
    }, [])

    const cambiarEstado = async (id, estado) => {
        try {
        await usuariosService.cambiarEstadoVendedor(id, estado)
        cargarVendedores()
        } catch {
        setError('Error al cambiar estado.')
        }
    }

    const badgeEstado = (estado) => {
        const clases = {
        activo:        'badge badge-success',
        pendiente:     'badge badge-warning',
        deshabilitado: 'badge badge-danger',
        }
        return clases[estado] || 'badge'
    }

    return (
        <div className="dashboard-wrapper">

        <SidebarAdmin />

        <div className="main-content">
            <div className="topbar">
            <span className="topbar-title">Gestión de Vendedores</span>
            <div className="topbar-user">
                <span>Administrador</span>
            </div>
            </div>

            <div className="content-area">
            {error && <div className="auth-error">{error}</div>}

            <div className="card">
                <div className="card-header">Vendedores registrados</div>
                {cargando ? (
                <p>Cargando...</p>
                ) : (
                <div className="table-wrapper">
                    <table>
                    <thead>
                        <tr>
                        <th>Email</th>
                        <th>Negocio</th>
                        <th>WhatsApp</th>
                        <th>Código catálogo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendedores.length === 0 ? (
                        <tr>
                            <td colSpan="6">No hay vendedores registrados.</td>
                        </tr>
                        ) : (
                        vendedores.map(v => (
                            <tr key={v.id}>
                            <td>{v.email}</td>
                            <td>{v.nombre_negocio || '-'}</td>
                            <td>{v.whatsapp || '-'}</td>
                            <td>{v.codigo_catalogo || '-'}</td>
                            <td>
                                <span className={badgeEstado(v.estado)}>
                                {v.estado}
                                </span>
                            </td>
                            <td>
                                {v.estado !== 'activo' && (
                                <button
                                    className="btn btn-success"
                                    onClick={() => cambiarEstado(v.id, 'activo')}
                                >
                                    Aprobar
                                </button>
                                )}
                                {v.estado !== 'deshabilitado' && (
                                <button
                                    className="btn btn-danger"
                                    onClick={() => cambiarEstado(v.id, 'deshabilitado')}
                                >
                                    Deshabilitar
                                </button>
                                )}
                            </td>
                            </tr>
                        ))
                        )}
                    </tbody>
                    </table>
                </div>
                )}
            </div>
            </div>
        </div>

        </div>
    )
    }

    export default Vendedores