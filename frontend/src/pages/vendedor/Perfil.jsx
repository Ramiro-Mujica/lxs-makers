    import { useState, useEffect } from 'react'
    import { usuariosService } from '../../services/api'
    import SidebarVendedor from '../../components/SidebarVendedor'
    import '../../styles/dashboard.css'

    function Perfil() {
    const [perfil, setPerfil]         = useState(null)
    const [cargando, setCargando]     = useState(true)
    const [error, setError]           = useState('')
    const [exito, setExito]           = useState('')
    const [editando, setEditando]     = useState(false)
    const [guardando, setGuardando]   = useState(false)
    const [form, setForm]             = useState({
        nombre_negocio: '',
        whatsapp:       '',
        descripcion:    '',
    })

    const cargarPerfil = async () => {
        try {
        const res = await usuariosService.perfil()
        setPerfil(res.data)
        setForm({
            nombre_negocio: res.data.nombre_negocio || '',
            whatsapp:       res.data.whatsapp       || '',
            descripcion:    res.data.descripcion    || '',
        })
        } catch {
        setError('Error al cargar el perfil.')
        } finally {
        setCargando(false)
        }
    }

    useEffect(() => { cargarPerfil() }, [])

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

    const handleGuardar = async (e) => {
        e.preventDefault()
        setError('')
        setExito('')
        setGuardando(true)
        try {
        await usuariosService.actualizarPerfil(form)
        setExito('Perfil actualizado correctamente.')
        setEditando(false)
        cargarPerfil()
        } catch {
        setError('Error al actualizar el perfil.')
        } finally {
        setGuardando(false)
        }
    }

    const linkCatalogo = perfil?.codigo_catalogo
        ? `${window.location.origin}/catalogo/${perfil.codigo_catalogo}`
        : null

    const copiarLink = () => {
        if (!linkCatalogo) return
        navigator.clipboard.writeText(linkCatalogo)
        setExito('Link copiado al portapapeles.')
        setTimeout(() => setExito(''), 3000)
    }

    if (cargando) return (
        <div className="dashboard-wrapper">
        <SidebarVendedor />
        <div className="main-content">
            <div className="topbar"><span className="topbar-title">Mi perfil</span></div>
            <div className="content-area"><p>Cargando...</p></div>
        </div>
        </div>
    )

    return (
        <div className="dashboard-wrapper">
        <SidebarVendedor />

        <div className="main-content">
            <div className="topbar">
            <span className="topbar-title">Mi perfil</span>
            <div className="topbar-user">
                {!editando && (
                <button className="btn btn-primary" onClick={() => setEditando(true)}>
                    Editar perfil
                </button>
                )}
            </div>
            </div>

            <div className="content-area">
            {error && <div className="auth-error">{error}</div>}
            {exito && <div className="auth-success">{exito}</div>}

            <div className="perfil-grid">
                <div className="card">
                <div className="card-header">Información del negocio</div>

                {!editando ? (
                    <div className="perfil-info">
                    <div className="perfil-campo">
                        <span className="perfil-label">Email</span>
                        <span className="perfil-valor">{perfil?.email}</span>
                    </div>
                    <div className="perfil-campo">
                        <span className="perfil-label">Nombre del negocio</span>
                        <span className="perfil-valor">{perfil?.nombre_negocio || '-'}</span>
                    </div>
                    <div className="perfil-campo">
                        <span className="perfil-label">WhatsApp</span>
                        <span className="perfil-valor">{perfil?.whatsapp || '-'}</span>
                    </div>
                    <div className="perfil-campo">
                        <span className="perfil-label">Descripción</span>
                        <span className="perfil-valor">{perfil?.descripcion || '-'}</span>
                    </div>
                    </div>
                ) : (
                    <form onSubmit={handleGuardar}>
                    <div className="form-group">
                        <label>Nombre del negocio</label>
                        <input
                        type="text"
                        name="nombre_negocio"
                        value={form.nombre_negocio}
                        onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>WhatsApp</label>
                        <input
                        type="text"
                        name="whatsapp"
                        value={form.whatsapp}
                        onChange={handleChange}
                        placeholder="+54 9 11 1234 5678"
                        />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                        name="descripcion"
                        value={form.descripcion}
                        onChange={handleChange}
                        placeholder="Describí tu negocio..."
                        />
                    </div>
                    <div className="acciones-group">
                        <button className="btn btn-primary" type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={() => setEditando(false)}>
                        Cancelar
                        </button>
                    </div>
                    </form>
                )}
                </div>

                <div className="card">
                <div className="card-header">Mi catálogo</div>
                {perfil?.codigo_catalogo ? (
                    <div className="perfil-catalogo">
                    <div className="perfil-campo">
                        <span className="perfil-label">Código de catálogo</span>
                        <span className="codigo-catalogo">{perfil.codigo_catalogo}</span>
                    </div>
                    <div className="perfil-campo">
                        <span className="perfil-label">Link público</span>
                        <span className="perfil-valor link-catalogo">{linkCatalogo}</span>
                    </div>
                    <button className="btn btn-success" onClick={copiarLink}>
                        Copiar link del catálogo
                    </button>
                    <p className="text-muted">
                        Compartí este link con tus clientes para que vean tus productos y hagan pedidos.
                    </p>
                    </div>
                ) : (
                    <p className="text-muted">
                    Tu código de catálogo será asignado por el administrador cuando active tu cuenta.
                    </p>
                )}
                </div>
            </div>
            </div>
        </div>
        </div>
    )
    }

    export default Perfil