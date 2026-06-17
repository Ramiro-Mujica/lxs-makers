import { useAuth } from '../context/AuthContext'
import SidebarAdmin from '../components/SidebarAdmin'
import SidebarVendedor from '../components/SidebarVendedor'
import '../styles/dashboard.css'

function Dashboard() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'administrador'

  return (
    <div className="dashboard-wrapper">

      {esAdmin ? <SidebarAdmin /> : <SidebarVendedor />}

      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">Dashboard</span>
          <div className="topbar-user">
            <span>{esAdmin ? 'Administrador' : 'Vendedor'}</span>
          </div>
        </div>

        <div className="content-area">
          {esAdmin && (
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
          )}

          {!esAdmin && (
            <div className="card">
              <div className="card-header">Bienvenido a LXS Makers</div>
              <p>Usá el menú para gestionar tus productos, pedidos y tableros.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default Dashboard