import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()
const INACTIVIDAD_MS = 30 * 60 * 1000

export function AuthProvider({ children }) {
  const navigate              = useNavigate()
  const [usuario, setUsuario] = useState(() => {
    const access = localStorage.getItem('access')
    const rol    = localStorage.getItem('rol')
    const id     = localStorage.getItem('id')
    if (access && rol) return { id, rol }
    return null
  })
  const timerRef = useRef(null)

  const cerrarSesion = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('rol')
    localStorage.removeItem('id')
    setUsuario(null)
    navigate('/login')
  }

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(cerrarSesion, INACTIVIDAD_MS)
  }

  useEffect(() => {
    const access = localStorage.getItem('access')
    if (access) resetTimer()

    const eventos = ['mousemove', 'keydown', 'click', 'scroll']
    eventos.forEach(e => window.addEventListener(e, resetTimer))

    return () => {
      eventos.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}