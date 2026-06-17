import { useNavigate } from 'react-router-dom'
import '../styles/dashboard.css'

function Dashboard() {
  const navigate = useNavigate()

  const cerrarSesion = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('rol')
    localStorage.removeItem('id')
    navigate('/login')
  }

  const rol = localStorage.getItem('rol')

  return (
    <div className="dashboard-wrapper">

      <aside className="sidebar">
        <div className="sidebar-brand">LXS Makers</div>
        <nav className="sidebar-nav">
          <a href="/admin/dashboard" className="active">Dashboard</a>
          {rol === 'administrador' && (
            <a href="/admin/vendedores">Vendedores</a>
          )}
        </nav>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">Dashboard</span>
          <div className="topbar-user">
            <span>{rol === 'administrador' ? 'Administrador' : 'Vendedor'}</span>
            <button className="btn btn-danger" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="content-area">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-info">
                <h3>0</h3>
                <p>Vendedores activos</p>
              </div>
            </div>
            <div className="stat-card warning">
              <div className="stat-card-info">
                <h3>0</h3>
                <p>Pendientes de aprobación</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Dashboard