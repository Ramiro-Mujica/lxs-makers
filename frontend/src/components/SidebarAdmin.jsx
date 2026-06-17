import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

function SidebarAdmin() {
  const { cerrarSesion } = useAuth()
  const location = useLocation()

  const activo = (ruta) => location.pathname === ruta ? 'active' : ''

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">LXS Makers</div>
      <nav className="sidebar-nav">
        <Link to="/admin/dashboard" className={activo('/admin/dashboard')}>Dashboard</Link>
        <Link to="/admin/vendedores" className={activo('/admin/vendedores')}>Vendedores</Link>
      </nav>
      <div className="sidebar-footer">
        <button className="btn btn-danger" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    </aside>
  )
}

export default SidebarAdmin