import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

function SidebarVendedor() {
  const { cerrarSesion } = useAuth()
  const location = useLocation()

  const activo = (ruta) => location.pathname === ruta ? 'active' : ''

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">LXS Makers</div>
      <nav className="sidebar-nav">
        <Link to="/vendedor/dashboard"     className={activo('/vendedor/dashboard')}>Dashboard</Link>
        <Link to="/vendedor/productos"     className={activo('/vendedor/productos')}>Productos</Link>
        <Link to="/vendedor/pedidos"       className={activo('/vendedor/pedidos')}>Pedidos</Link>
        <Link to="/vendedor/tableros"      className={activo('/vendedor/tableros')}>Tableros</Link>
        <Link to="/vendedor/estadisticas"  className={activo('/vendedor/estadisticas')}>Estadísticas</Link>
        <Link to="/vendedor/perfil"        className={activo('/vendedor/perfil')}>Mi perfil</Link>
      </nav>
      <div className="sidebar-footer">
        <button className="btn btn-danger" onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    </aside>
  )
}

export default SidebarVendedor