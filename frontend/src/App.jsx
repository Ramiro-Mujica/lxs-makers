import { Routes, Route } from 'react-router-dom'
import './index.css'

import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/vendedor/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App