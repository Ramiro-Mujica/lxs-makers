import '../styles/auth.css'

function Inicio() {
  return (
    <div className="auth-wrapper">
      <div className="auth-card">

        <div className="auth-logo">
          <h1>LXS Makers</h1>
          <p>Sistema de gestión comercial para emprendedores</p>
        </div>

        <div className="auth-footer" style={{ marginTop: '0' }}>
          <a href="/login">Iniciar sesión</a>
          <span> · </span>
          <a href="/registro">Crear cuenta</a>
        </div>

      </div>
    </div>
  )
}

export default Inicio