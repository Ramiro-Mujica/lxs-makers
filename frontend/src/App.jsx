import { Routes, Route } from 'react-router-dom'
import './index.css'

import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import Vendedores from './pages/admin/Vendedores'
import Productos from './pages/vendedor/Productos'
import RutaProtegida from './components/RutaProtegida'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/admin/dashboard" element={
        <RutaProtegida rolRequerido="administrador">
          <Dashboard />
        </RutaProtegida>
      } />
      <Route path="/admin/vendedores" element={
        <RutaProtegida rolRequerido="administrador">
          <Vendedores />
        </RutaProtegida>
      } />
      <Route path="/vendedor/dashboard" element={
        <RutaProtegida rolRequerido="vendedor">
          <Dashboard />
        </RutaProtegida>
      } />
      <Route path="/vendedor/productos" element={
        <RutaProtegida rolRequerido="vendedor">
          <Productos />
        </RutaProtegida>
      } />
    </Routes>
  )
}

export default App