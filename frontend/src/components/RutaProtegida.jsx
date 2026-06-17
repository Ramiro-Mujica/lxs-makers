import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function RutaProtegida({ children, rolRequerido }) {
  const { usuario } = useAuth()

  if (!usuario) return <Navigate to="/login" />

  if (rolRequerido && usuario.rol !== rolRequerido) {
    return <Navigate to="/login" />
  }

  return children
}

export default RutaProtegida