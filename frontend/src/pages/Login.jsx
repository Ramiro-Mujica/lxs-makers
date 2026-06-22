    import { useState } from 'react'
    import { useNavigate } from 'react-router-dom'
    import { usuariosService } from '../services/api'
    import { useAuth } from '../context/AuthContext'
    import '../styles/auth.css'

    function Login() {
    const navigate                    = useNavigate()
    const { iniciarSesion }           = useAuth()
    const [form, setForm]             = useState({ email: '', password: '' })
    const [error, setError]           = useState('')
    const [cargando, setCargando]     = useState(false)

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)
        try {
        const res = await usuariosService.login(form)
        iniciarSesion(res.data)
        if (res.data.rol === 'administrador') {
            navigate('/admin/dashboard')
        } else {
            navigate('/vendedor/dashboard')
        }
        } catch (err) {
        setError(err.response?.data?.detail || 'Error al iniciar sesión.')
        } finally {
        setCargando(false)
        }
    }

    return (
        <div className="auth-wrapper">
        <div className="auth-card">

            <div className="auth-logo">
            <h1>LXS Makers</h1>
            <p>Sistema de gestión comercial</p>
            </div>

            <h2 className="auth-title">Iniciar sesión</h2>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>Email</label>
                <input
                type="email"
                name="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={handleChange}
                required
                />
            </div>

            <div className="form-group">
                <label>Contraseña</label>
                <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                />
            </div>

            <button className="btn-auth" disabled={cargando}>
                {cargando ? 'Ingresando...' : 'Ingresar'}
            </button>
            </form>

            <div className="auth-footer">
            <a href="/">Volver al inicio</a>
            <span> · </span>
            ¿No tenés cuenta? <a href="/registro">Registrate</a>
            </div>

        </div>
        </div>
    )
    }

    export default Login