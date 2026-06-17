import { useState } from 'react'
import { usuariosService } from '../services/api'
import '../styles/auth.css'

const validarPassword = (password) => {
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
  if (!/[A-Z]/.test(password)) return 'La contraseña debe tener al menos una mayúscula.'
  if (!/[a-z]/.test(password)) return 'La contraseña debe tener al menos una minúscula.'
  if (!/[0-9]/.test(password)) return 'La contraseña debe tener al menos un número.'
  return null
}

function Registro() {
  const [form, setForm]         = useState({ email: '', password: '', nombre_negocio: '', whatsapp: '' })
  const [error, setError]       = useState('')
  const [exito, setExito]       = useState('')
  const [cargando, setCargando] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')

    const errorPassword = validarPassword(form.password)
    if (errorPassword) {
      setError(errorPassword)
      return
    }

    setCargando(true)
    try {
      await usuariosService.registro(form)
      setExito('Registro exitoso. Tu cuenta está pendiente de aprobación.')
    } catch (err) {
      const data = err.response?.data
      if (data?.email) {
        setError(data.email[0])
      } else if (data?.password) {
        setError(data.password[0])
      } else {
        setError('Error al registrarse. Intentá de nuevo.')
      }
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

        <h2 className="auth-title">Crear cuenta</h2>

        {error && <div className="auth-error">{error}</div>}
        {exito && <div className="auth-success">{exito}</div>}

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
            <label>Nombre del negocio</label>
            <input
              type="text"
              name="nombre_negocio"
              placeholder="Mi tienda"
              value={form.nombre_negocio}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>WhatsApp</label>
            <input
              type="text"
              name="whatsapp"
              placeholder="+54 9 11 1234 5678"
              value={form.whatsapp}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="Mín. 6 caracteres, 1 mayúscula, 1 número"
              value={form.password}
              onChange={handleChange}
              required
            />
            <small className="form-hint">Mínimo 6 caracteres, una mayúscula y un número.</small>
          </div>

          <button className="btn-auth" disabled={cargando}>
            {cargando ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-footer">
          <a href="/">Volver al inicio</a>
          <span> · </span>
          ¿Ya tenés cuenta? <a href="/login">Iniciá sesión</a>
        </div>

      </div>
    </div>
  )
}

export default Registro