import { useState, useEffect } from 'react'
import { productosService } from '../../services/api'
import SidebarVendedor from '../../components/SidebarVendedor'
import '../../styles/dashboard.css'

function Productos() {
  const [productos, setProductos]   = useState([])
  const [cargando, setCargando]     = useState(true)
  const [error, setError]           = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm]             = useState({
    nombre: '', descripcion: '', precio_venta: '', precio_costo: '', estado: 'visible'
  })

  const cargarProductos = async () => {
    try {
      const res = await productosService.listar()
      setProductos(res.data)
    } catch {
      setError('Error al cargar productos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarProductos()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await productosService.crear(form)
      setForm({ nombre: '', descripcion: '', precio_venta: '', precio_costo: '', estado: 'visible' })
      setMostrarForm(false)
      cargarProductos()
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const primer_error = Object.values(data)[0]
        setError(Array.isArray(primer_error) ? primer_error[0] : primer_error)
      } else {
        setError('Error al crear producto.')
      }
    }
  }

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return
    try {
      await productosService.eliminar(id)
      cargarProductos()
    } catch {
      setError('Error al eliminar producto.')
    }
  }

  const badgeEstado = (estado) => {
    const clases = {
      visible:   'badge badge-success',
      sin_stock: 'badge badge-warning',
      oculto:    'badge badge-danger',
    }
    return clases[estado] || 'badge'
  }

  return (
    <div className="dashboard-wrapper">

      <SidebarVendedor />

      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">Mis Productos</span>
          <div className="topbar-user">
            <button className="btn btn-primary" onClick={() => setMostrarForm(!mostrarForm)}>
              {mostrarForm ? 'Cancelar' : 'Nuevo producto'}
            </button>
          </div>
        </div>

        <div className="content-area">
          {error && <div className="auth-error">{error}</div>}

          {mostrarForm && (
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div className="card-header">Nuevo producto</div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nombre</label>
                  <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Precio de venta</label>
                  <input type="number" name="precio_venta" value={form.precio_venta} onChange={handleChange} required min="0" step="0.01" />
                </div>
                <div className="form-group">
                  <label>Precio de costo</label>
                  <input type="number" name="precio_costo" value={form.precio_costo} onChange={handleChange} required min="0.01" step="0.01" />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select name="estado" value={form.estado} onChange={handleChange}>
                    <option value="visible">Visible</option>
                    <option value="sin_stock">Sin stock</option>
                    <option value="oculto">Oculto</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit">Guardar producto</button>
              </form>
            </div>
          )}

          <div className="card">
            <div className="card-header">Catálogo</div>
            {cargando ? (
              <p>Cargando...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Precio venta</th>
                      <th>Precio costo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.length === 0 ? (
                      <tr>
                        <td colSpan="5">No hay productos cargados.</td>
                      </tr>
                    ) : (
                      productos.map(p => (
                        <tr key={p.id}>
                          <td>{p.nombre}</td>
                          <td>${Number(p.precio_venta).toLocaleString('es-AR')}</td>
                          <td>${Number(p.precio_costo).toLocaleString('es-AR')}</td>
                          <td><span className={badgeEstado(p.estado)}>{p.estado}</span></td>
                          <td>
                            <button className="btn btn-danger" onClick={() => eliminarProducto(p.id)}>
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

export default Productos