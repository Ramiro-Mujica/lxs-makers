import '../styles/auth.css'

function Login() {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        <div className="auth-logo">
          <h1>LXS Makers</h1>
          <p>Sistema de gestión comercial</p>
        </div>

        <h2 className="auth-title">Iniciar sesión</h2>

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="tu@email.com" />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" placeholder="••••••••" />
        </div>

        <button className="btn-auth">Ingresar</button>

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