import '../styles/auth.css'

function Registro() {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        <div className="auth-logo">
          <h1>LXS Makers</h1>
          <p>Sistema de gestión comercial</p>
        </div>

        <h2 className="auth-title">Crear cuenta</h2>

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="tu@email.com" />
        </div>

        <div className="form-group">
          <label>Nombre del negocio</label>
          <input type="text" placeholder="Mi tienda" />
        </div>

        <div className="form-group">
          <label>WhatsApp</label>
          <input type="text" placeholder="+54 9 11 1234 5678" />
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" placeholder="••••••••" />
        </div>

        <button className="btn-auth">Registrarse</button>

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