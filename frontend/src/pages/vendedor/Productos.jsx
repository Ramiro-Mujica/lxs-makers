import { useState, useEffect } from 'react'
import { productosService } from '../../services/api'
import SidebarVendedor from '../../components/SidebarVendedor'
import '../../styles/dashboard.css'

const FORM_VACIO = { nombre: '', descripcion: '', precio_venta: '', precio_costo: '', estado: 'visible' }

function Productos() {
    const [productos, setProductos]           = useState([])
    const [cargando, setCargando]             = useState(true)
    const [error, setError]                   = useState('')
    const [mostrarForm, setMostrarForm]       = useState(false)
    const [productoActivo, setProductoActivo] = useState(null)
    const [form, setForm]                     = useState(FORM_VACIO)
    const [formEditar, setFormEditar]         = useState({})
    const [archivoImagen, setArchivoImagen]   = useState(null)
    const [ordenImagen, setOrdenImagen]       = useState(0)
    const [tipoVariante, setTipoVariante]     = useState('')
    const [valorVariante, setValorVariante]   = useState('')

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

  useEffect(() => { cargarProductos() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleChangeEditar = (e) => setFormEditar({ ...formEditar, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await productosService.crear(form)
      setForm(FORM_VACIO)
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

  const handleEditar = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await productosService.actualizar(productoActivo.id, formEditar)
      cargarProductos()
      setProductoActivo(null)
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const primer_error = Object.values(data)[0]
        setError(Array.isArray(primer_error) ? primer_error[0] : primer_error)
      } else {
        setError('Error al editar producto.')
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

  const abrirDetalle = (p) => {
    setProductoActivo(p)
    setFormEditar({
      nombre:       p.nombre,
      descripcion:  p.descripcion || '',
      precio_venta: p.precio_venta,
      precio_costo: p.precio_costo,
      estado:       p.estado,
    })
    setError('')
  }

    const handleAgregarImagen = async () => {
    if (!archivoImagen) return
    try {
        await productosService.agregarImagen(productoActivo.id, archivoImagen, ordenImagen)
        setArchivoImagen(null)
        setOrdenImagen(0)
        const res = await productosService.listar()
        const actualizado = res.data.find(p => p.id === productoActivo.id)
        setProductoActivo(actualizado)
        setProductos(res.data)
    } catch {
        setError('Error al agregar imagen.')
    }
    }

  const handleEliminarImagen = async (imgId) => {
    try {
      await productosService.eliminarImagen(productoActivo.id, imgId)
      const res = await productosService.listar()
      const actualizado = res.data.find(p => p.id === productoActivo.id)
      setProductoActivo(actualizado)
      setProductos(res.data)
    } catch {
      setError('Error al eliminar imagen.')
    }
  }

  const handleAgregarVariante = async () => {
    if (!tipoVariante.trim() || !valorVariante.trim()) return
    try {
      await productosService.agregarVariante(productoActivo.id, { tipo: tipoVariante, valor: valorVariante })
      setTipoVariante('')
      setValorVariante('')
      const res = await productosService.listar()
      const actualizado = res.data.find(p => p.id === productoActivo.id)
      setProductoActivo(actualizado)
      setProductos(res.data)
    } catch {
      setError('Error al agregar variante.')
    }
  }

  const handleEliminarVariante = async (varId) => {
    try {
      await productosService.eliminarVariante(productoActivo.id, varId)
      const res = await productosService.listar()
      const actualizado = res.data.find(p => p.id === productoActivo.id)
      setProductoActivo(actualizado)
      setProductos(res.data)
    } catch {
      setError('Error al eliminar variante.')
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
            <button className="btn btn-primary" onClick={() => { setMostrarForm(!mostrarForm); setProductoActivo(null) }}>
              {mostrarForm ? 'Cancelar' : 'Nuevo producto'}
            </button>
          </div>
        </div>

        <div className="content-area">
          {error && <div className="auth-error">{error}</div>}

          {mostrarForm && (
            <div className="card card-mb">
              <div className="card-header">Nuevo producto</div>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <select name="estado" value={form.estado} onChange={handleChange}>
                      <option value="visible">Visible</option>
                      <option value="sin_stock">Sin stock</option>
                      <option value="oculto">Oculto</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea name="descripcion" value={form.descripcion} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Precio de venta</label>
                    <input type="number" name="precio_venta" value={form.precio_venta} onChange={handleChange} required min="0" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Precio de costo</label>
                    <input type="number" name="precio_costo" value={form.precio_costo} onChange={handleChange} required min="0.01" step="0.01" />
                  </div>
                </div>
                <button className="btn btn-primary" type="submit">Guardar producto</button>
              </form>
            </div>
          )}

          {productoActivo && (
            <div className="card card-mb">
              <div className="card-header">Editar: {productoActivo.nombre}</div>
              <form onSubmit={handleEditar}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input type="text" name="nombre" value={formEditar.nombre} onChange={handleChangeEditar} required />
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <select name="estado" value={formEditar.estado} onChange={handleChangeEditar}>
                      <option value="visible">Visible</option>
                      <option value="sin_stock">Sin stock</option>
                      <option value="oculto">Oculto</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <textarea name="descripcion" value={formEditar.descripcion} onChange={handleChangeEditar} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Precio de venta</label>
                    <input type="number" name="precio_venta" value={formEditar.precio_venta} onChange={handleChangeEditar} required min="0" step="0.01" />
                  </div>
                  <div className="form-group">
                    <label>Precio de costo</label>
                    <input type="number" name="precio_costo" value={formEditar.precio_costo} onChange={handleChangeEditar} required min="0.01" step="0.01" />
                  </div>
                </div>
                <div className="acciones-group">
                  <button className="btn btn-primary" type="submit">Guardar cambios</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setProductoActivo(null)}>Cancelar</button>
                </div>
              </form>

              <div className="card-header" style={null}>Imágenes ({productoActivo.imagenes?.length || 0}/5)</div>
              <div className="imagenes-grid">
                {productoActivo.imagenes?.map(img => (
                  <div className="imagen-item" key={img.id}>
                    <img src={img.url} alt={`orden ${img.orden}`} />
                    <button className="btn btn-danger" onClick={() => handleEliminarImagen(img.id)}>X</button>
                  </div>
                ))}
              </div>
              {(productoActivo.imagenes?.length || 0) < 5 && (
                <div className="form-row">
                    <div className="form-group">
                    <label>Imagen (máx. 2MB — JPG, PNG)</label>
                    <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={e => setArchivoImagen(e.target.files[0])}
                    />
                    </div>
                    <div className="form-group">
                    <label>Orden (0 = principal)</label>
                    <input
                        type="number"
                        value={ordenImagen}
                        onChange={e => setOrdenImagen(Number(e.target.value))}
                        min="0"
                        max="4"
                    />
                    </div>
                </div>
                )}
                {(productoActivo.imagenes?.length || 0) < 5 && (
                <button className="btn btn-success" onClick={handleAgregarImagen}>
                    Agregar imagen
                </button>
                )}

              <div className="card-header">Variantes</div>
              <div className="variantes-lista">
                {productoActivo.variantes?.map(v => (
                  <div className="variante-item" key={v.id}>
                    <span>{v.tipo}: {v.valor}</span>
                    <button className="btn btn-danger" onClick={() => handleEliminarVariante(v.id)}>X</button>
                  </div>
                ))}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo (ej: Talle)</label>
                  <input type="text" value={tipoVariante} onChange={e => setTipoVariante(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Valor (ej: M)</label>
                  <input type="text" value={valorVariante} onChange={e => setValorVariante(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-success" onClick={handleAgregarVariante}>Agregar variante</button>
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
                      <tr><td colSpan="5">No hay productos cargados.</td></tr>
                    ) : (
                      productos.map(p => (
                        <tr key={p.id}>
                          <td>{p.nombre}</td>
                          <td>${Number(p.precio_venta).toLocaleString('es-AR')}</td>
                          <td>${Number(p.precio_costo).toLocaleString('es-AR')}</td>
                          <td><span className={badgeEstado(p.estado)}>{p.estado}</span></td>
                          <td>
                            <div className="acciones-group">
                              <button className="btn btn-primary" onClick={() => abrirDetalle(p)}>Editar</button>
                              <button className="btn btn-danger" onClick={() => eliminarProducto(p.id)}>Eliminar</button>
                            </div>
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