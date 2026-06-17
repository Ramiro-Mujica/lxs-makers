import { useState, useEffect } from 'react'
import { pedidosService, productosService } from '../../services/api'
import SidebarVendedor from '../../components/SidebarVendedor'
import '../../styles/dashboard.css'

function Pedidos() {
  const [pedidos, setPedidos]           = useState([])
  const [productos, setProductos]       = useState([])
  const [cargando, setCargando]         = useState(true)
  const [error, setError]               = useState('')
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [pedidoActivo, setPedidoActivo] = useState(null)
  const [form, setForm]                 = useState({ nombre_cliente: '', comentario: '' })
  const [productoSel, setProductoSel]   = useState('')
  const [cantidad, setCantidad]         = useState(1)
  const [variante, setVariante]         = useState('')

  const cargarDatos = async () => {
    try {
      const [resPedidos, resProductos] = await Promise.all([
        pedidosService.listar(),
        productosService.listar(),
      ])
      setPedidos(resPedidos.data)
      setProductos(resProductos.data.filter(p => p.estado === 'visible'))
    } catch {
      setError('Error al cargar datos.')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargarDatos() }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const crearPedido = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await pedidosService.crear(form)
      setForm({ nombre_cliente: '', comentario: '' })
      setMostrarForm(false)
      await cargarDatos()
      const nuevoPedido = res.data
      setPedidoActivo(nuevoPedido)
    } catch {
      setError('Error al crear pedido.')
    }
  }

  const cambiarEstado = async (id, estado) => {
    try {
      await pedidosService.actualizar(id, { estado })
      await cargarDatos()
      if (pedidoActivo?.id === id) {
        const res = await pedidosService.listar()
        const actualizado = res.data.find(p => p.id === id)
        setPedidoActivo(actualizado)
      }
    } catch {
      setError('Error al cambiar estado.')
    }
  }

  const eliminarPedido = async (id) => {
    if (!window.confirm('¿Eliminar este pedido?')) return
    try {
      await pedidosService.eliminar(id)
      setPedidoActivo(null)
      cargarDatos()
    } catch {
      setError('Error al eliminar pedido.')
    }
  }

  const agregarProducto = async () => {
    if (!productoSel) return
    setError('')
    try {
      await pedidosService.agregarDetalle(pedidoActivo.id, {
        producto_id: productoSel,
        cantidad,
        variante,
      })
      setProductoSel('')
      setCantidad(1)
      setVariante('')
      const res = await pedidosService.listar()
      const actualizado = res.data.find(p => p.id === pedidoActivo.id)
      setPedidoActivo(actualizado)
      setPedidos(res.data)
    } catch {
      setError('Error al agregar producto.')
    }
  }

  const eliminarDetalle = async (detId) => {
    try {
      await pedidosService.eliminarDetalle(pedidoActivo.id, detId)
      const res = await pedidosService.listar()
      const actualizado = res.data.find(p => p.id === pedidoActivo.id)
      setPedidoActivo(actualizado)
      setPedidos(res.data)
    } catch {
      setError('Error al eliminar producto del pedido.')
    }
  }

  const badgeEstado = (estado) => {
    const clases = {
      pendiente:  'badge badge-warning',
      en_proceso: 'badge badge-info',
      enviado:    'badge badge-primary',
      completado: 'badge badge-success',
    }
    return clases[estado] || 'badge'
  }

  const productoSeleccionado = productos.find(p => p.id === productoSel)

  return (
    <div className="dashboard-wrapper">
      <SidebarVendedor />

      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">Pedidos</span>
          <div className="topbar-user">
            <button className="btn btn-primary" onClick={() => { setMostrarForm(!mostrarForm); setPedidoActivo(null) }}>
              {mostrarForm ? 'Cancelar' : 'Nuevo pedido'}
            </button>
          </div>
        </div>

        <div className="content-area">
          {error && !pedidoActivo && <div className="auth-error">{error}</div>}

          {mostrarForm && (
            <div className="card card-mb">
              <div className="card-header">Nuevo pedido</div>
              <form onSubmit={crearPedido}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre del cliente</label>
                    <input type="text" name="nombre_cliente" value={form.nombre_cliente} onChange={handleChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Comentario</label>
                  <textarea name="comentario" value={form.comentario} onChange={handleChange} />
                </div>
                <button className="btn btn-primary" type="submit">Crear pedido</button>
              </form>
            </div>
          )}

          <div className="card">
            <div className="card-header">Pedidos activos (últimos 7 días)</div>
            {cargando ? (
              <p>Cargando...</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Días restantes</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.length === 0 ? (
                      <tr><td colSpan="6">No hay pedidos activos.</td></tr>
                    ) : (
                      pedidos.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.codigo_seguimiento}</strong></td>
                          <td>{p.nombre_cliente || '-'}</td>
                          <td>${Number(p.total).toLocaleString('es-AR')}</td>
                          <td><span className={badgeEstado(p.estado)}>{p.estado}</span></td>
                          <td>{p.dias_restantes} días</td>
                          <td>
                            <div className="acciones-group">
                              <button className="btn btn-primary" onClick={() => setPedidoActivo(p)}>Ver</button>
                              <button className="btn btn-danger" onClick={() => eliminarPedido(p.id)}>Eliminar</button>
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

      {pedidoActivo && (
        <div className="modal-overlay" onClick={() => setPedidoActivo(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h2>Pedido #{pedidoActivo.codigo_seguimiento}</h2>
              <button className="btn-cerrar" onClick={() => setPedidoActivo(null)}>✕</button>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Cliente</label>
                <input type="text" value={pedidoActivo.nombre_cliente || ''} readOnly />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select value={pedidoActivo.estado} onChange={e => cambiarEstado(pedidoActivo.id, e.target.value)}>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="enviado">Enviado</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
            </div>

            <div className="modal-seccion">
              <div className="modal-seccion-titulo">Productos del pedido</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Variante</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidoActivo.detalles?.length === 0 ? (
                      <tr><td colSpan="5">Sin productos.</td></tr>
                    ) : (
                      pedidoActivo.detalles?.map(d => (
                        <tr key={d.id}>
                          <td>{d.nombre_producto}</td>
                          <td>{d.variante || '-'}</td>
                          <td>{d.cantidad}</td>
                          <td>${Number(d.precio_venta * d.cantidad).toLocaleString('es-AR')}</td>
                          <td>
                            <button className="btn btn-danger" onClick={() => eliminarDetalle(d.id)}>✕</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="pedido-total">
                Total: <strong>${Number(pedidoActivo.total).toLocaleString('es-AR')}</strong>
              </div>
            </div>

            <div className="modal-seccion">
              <div className="modal-seccion-titulo">Agregar producto</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Producto</label>
                  <select value={productoSel} onChange={e => setProductoSel(e.target.value)}>
                    <option value="">Seleccioná un producto</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} — ${Number(p.precio_venta).toLocaleString('es-AR')}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Cantidad</label>
                  <input type="number" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} min="1" />
                </div>
              </div>
              {productoSeleccionado?.variantes?.length > 0 && (
                <div className="form-group">
                  <label>Variante</label>
                  <select value={variante} onChange={e => setVariante(e.target.value)}>
                    <option value="">Sin variante</option>
                    {productoSeleccionado.variantes.map(v => (
                      <option key={v.id} value={`${v.tipo}: ${v.valor}`}>{v.tipo}: {v.valor}</option>
                    ))}
                  </select>
                </div>
              )}
              <button className="btn btn-success" onClick={agregarProducto} disabled={!productoSel}>
                Agregar al pedido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default Pedidos