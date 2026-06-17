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
  const [tipoVariante, setTipoVariante]     = useState('')
  const [valorVariante, setValorVariante]   = useState('')
  const [guardando, setGuardando]           = useState(false)

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
    setGuardando(true)
    try {
      await productosService.actualizar(productoActivo.id, formEditar)
      await refrescarActivo()
      cargarProductos()
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const primer_error = Object.values(data)[0]
        setError(Array.isArray(primer_error) ? primer_error[0] : primer_error)
      } else {
        setError('Error al editar producto.')
      }
    } finally {
      setGuardando(false)
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
    setArchivoImagen(null)
  }

  const cerrarModal = () => {
    setProductoActivo(null)
    setError('')
    setArchivoImagen(null)
  }

  const refrescarActivo = async () => {
    const res = await productosService.listar()
    setProductos(res.data)
    const actualizado = res.data.find(p => p.id === productoActivo.id)
    if (actualizado) setProductoActivo(actualizado)
  }

  const handleAgregarImagen = async () => {
    if (!archivoImagen) return
    setError('')
    try {
      const orden = productoActivo.imagenes?.length || 0
      await productosService.agregarImagen(productoActivo.id, archivoImagen, orden)
      setArchivoImagen(null)
      await refrescarActivo()
    } catch {
      setError('Error al agregar imagen.')
    }
  }

  const handleEliminarImagen = async (imgId) => {
    try {
      await productosService.eliminarImagen(productoActivo.id, imgId)
      await refrescarActivo()
    } catch {
      setError('Error al eliminar imagen.')
    }
  }

  const handleHacerPrincipal = async (imgId) => {
    try {
      const imagenes = [...productoActivo.imagenes]
      for (const img of imagenes) {
        const nuevoOrden = img.id === imgId ? 0 : imagenes.findIndex(i => i.id === img.id)
        await productosService.actualizarOrdenImagen(productoActivo.id, img.id, nuevoOrden)
      }
      await refrescarActivo()
    } catch {
      setError('Error al cambiar imagen principal.')
    }
  }

  const handleAgregarVariante = async () => {
    if (!tipoVariante.trim() || !valorVariante.trim()) return
    try {
      await productosService.agregarVariante(productoActivo.id, { tipo: tipoVariante, valor: valorVariante })
      setTipoVariante('')
      setValorVariante('')
      await refrescarActivo()
    } catch {
      setError('Error al agregar variante.')
    }
  }

  const handleEliminarVariante = async (varId) => {
    try {
      await productosService.eliminarVariante(productoActivo.id, varId)
      await refrescarActivo()
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
          {error && !productoActivo && <div className="auth-error">{error}</div>}

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

          <div className="card">
            <div className="card-header">Catálogo</div>
            {cargando ? (
              <p>Cargando...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Foto</th>
                      <th>Nombre</th>
                      <th>Precio venta</th>
                      <th>Precio costo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.length === 0 ? (
                      <tr><td colSpan="6">No hay productos cargados.</td></tr>
                    ) : (
                      productos.map(p => (
                        <tr key={p.id}>
                          <td>
                            {p.imagenes?.length > 0
                              ? <img src={p.imagenes.find(i => i.orden === 0)?.url || p.imagenes[0].url} alt={p.nombre} className="tabla-miniatura" />
                              : <span className="text-muted">Sin foto</span>
                            }
                          </td>
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

      {productoActivo && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h2>Editar producto</h2>
              <button className="btn-cerrar" onClick={cerrarModal}>✕</button>
            </div>

            {error && <div className="auth-error">{error}</div>}

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
              <button className="btn btn-primary" type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>

            <div className="modal-seccion">
              <div className="modal-seccion-titulo">Imágenes ({productoActivo.imagenes?.length || 0}/5)</div>
              <div className="imagenes-grid">
                {productoActivo.imagenes?.map(img => (
                  <div key={img.id} className={`imagen-item${img.orden === 0 ? ' principal' : ''}`}>
                    {img.orden === 0 && <span className="imagen-badge-principal">Principal</span>}
                    <img src={img.url} alt="" />
                    <div className="imagen-item-acciones">
                      {img.orden !== 0 && (
                        <button className="btn btn-success" onClick={() => handleHacerPrincipal(img.id)}>
                          Principal
                        </button>
                      )}
                      <button className="btn btn-danger" onClick={() => handleEliminarImagen(img.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {(productoActivo.imagenes?.length || 0) < 5 && (
                <div className="form-group">
                  <label>Agregar imagen (máx. 2MB — JPG, PNG)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={e => setArchivoImagen(e.target.files[0])}
                  />
                </div>
              )}
              {(productoActivo.imagenes?.length || 0) < 5 && (
                <button className="btn btn-success" onClick={handleAgregarImagen} disabled={!archivoImagen}>
                  Agregar imagen
                </button>
              )}
            </div>

            <div className="modal-seccion">
              <div className="modal-seccion-titulo">Variantes</div>
              <div className="variantes-lista">
                {productoActivo.variantes?.map(v => (
                  <div className="variante-item" key={v.id}>
                    <span>{v.tipo}: {v.valor}</span>
                    <button className="btn btn-danger" onClick={() => handleEliminarVariante(v.id)}>✕</button>
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
              <button className="btn btn-success" onClick={handleAgregarVariante} disabled={!tipoVariante || !valorVariante}>
                Agregar variante
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Productos