import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { productosService } from '../services/api'
import '../styles/catalogo.css'

function Catalogo() {
  const { codigo }                    = useParams()
  const [tienda, setTienda]           = useState(null)
  const [productos, setProductos]     = useState([])
  const [cargando, setCargando]       = useState(true)
  const [error, setError]             = useState('')
  const [carrito, setCarrito]         = useState([])
  const [carritoAbierto, setCarritoAbierto] = useState(false)
  const [variantesSeleccionadas, setVariantesSeleccionadas] = useState({})

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await productosService.catalogoPublico(codigo)
        setTienda({ negocio: res.data.negocio, whatsapp: res.data.whatsapp })
        setProductos(res.data.productos)
      } catch {
        setError('Catálogo no encontrado o no disponible.')
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [codigo])

  const seleccionarVariante = (productoId, tipo, valor) => {
    setVariantesSeleccionadas(prev => ({
      ...prev,
      [productoId]: { ...prev[productoId], [tipo]: valor }
    }))
  }

  const tieneTodasVariantes = (producto) => {
    if (!producto.variantes?.length) return true
    const tipos = [...new Set(producto.variantes.map(v => v.tipo))]
    const sel = variantesSeleccionadas[producto.id] || {}
    return tipos.every(t => sel[t])
  }

  const agregarAlCarrito = (producto) => {
    const sel = variantesSeleccionadas[producto.id] || {}
    const varianteTexto = Object.entries(sel).map(([k, v]) => `${k}: ${v}`).join(', ')

    const clave = `${producto.id}-${varianteTexto}`
    const existe = carrito.find(i => i.clave === clave)

    if (existe) {
      setCarrito(carrito.map(i => i.clave === clave ? { ...i, cantidad: i.cantidad + 1 } : i))
    } else {
      setCarrito([...carrito, {
        clave,
        producto_id:  producto.id,
        nombre:       producto.nombre,
        precio:       Number(producto.precio_venta),
        variante:     varianteTexto,
        cantidad:     1,
      }])
    }
    setCarritoAbierto(true)
  }

  const cambiarCantidad = (clave, delta) => {
    setCarrito(prev =>
      prev.map(i => i.clave === clave ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i)
    )
  }

  const eliminarItem = (clave) => {
    setCarrito(prev => prev.filter(i => i.clave !== clave))
  }

  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0)
  const cantidadItems = carrito.reduce((acc, i) => acc + i.cantidad, 0)

  const enviarWhatsApp = () => {
    if (!tienda?.whatsapp || carrito.length === 0) return

    const lineas = carrito.map(i =>
      `• ${i.nombre}${i.variante ? ` (${i.variante})` : ''} x${i.cantidad} = $${(i.precio * i.cantidad).toLocaleString('es-AR')}`
    )

    const mensaje = [
      `¡Hola! Quiero hacer un pedido:`,
      '',
      ...lineas,
      '',
      `*Total: $${totalCarrito.toLocaleString('es-AR')}*`,
    ].join('\n')

    const numero = tienda.whatsapp.replace(/\D/g, '')
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  if (cargando) return (
    <div className="catalogo-wrapper">
      <div className="catalogo-content">
        <p>Cargando catálogo...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="catalogo-wrapper">
      <div className="catalogo-content">
        <div className="catalogo-error">
          <p>{error}</p>
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="catalogo-wrapper">

      <header className="catalogo-header">
        <div className="catalogo-header-info">
          <h1>{tienda?.negocio || 'Catálogo'}</h1>
          <p>Código: {codigo}</p>
        </div>
        <Link to="/" className="catalogo-header-brand">Inicio</Link>
      </header>

      <div className="catalogo-content">
        {productos.length === 0 ? (
          <div className="catalogo-vacio">
            <p>Este catálogo no tiene productos disponibles.</p>
          </div>
        ) : (
          <div className="catalogo-grid">
            {productos.map(p => {
              const tipos = [...new Set(p.variantes?.map(v => v.tipo) || [])]
              const sel = variantesSeleccionadas[p.id] || {}
              const imagen = p.imagenes?.find(i => i.orden === 0)?.url || p.imagenes?.[0]?.url

              return (
                <div key={p.id} className="producto-card">
                  {imagen
                    ? <img src={imagen} alt={p.nombre} className="producto-card-img" />
                    : <div className="producto-card-img-placeholder">📦</div>
                  }
                  <div className="producto-card-body">
                    <div className="producto-card-nombre">{p.nombre}</div>
                    {p.descripcion && <div className="producto-card-desc">{p.descripcion}</div>}
                    <div className="producto-card-precio">${Number(p.precio_venta).toLocaleString('es-AR')}</div>

                    {tipos.map(tipo => (
                      <div key={tipo}>
                        <div className="variante-tipo">{tipo}</div>
                        <div className="producto-card-variantes">
                          {p.variantes.filter(v => v.tipo === tipo).map(v => (
                            <button
                              key={v.id}
                              className={`variante-btn${sel[tipo] === v.valor ? ' seleccionada' : ''}`}
                              onClick={() => seleccionarVariante(p.id, tipo, v.valor)}
                            >
                              {v.valor}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      className="btn-agregar"
                      onClick={() => agregarAlCarrito(p)}
                      disabled={!tieneTodasVariantes(p)}
                    >
                      {tieneTodasVariantes(p) ? 'Agregar al carrito' : 'Seleccioná opciones'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="carrito-flotante">
        {carritoAbierto && carrito.length > 0 && (
          <div className="carrito-panel">
            <div className="carrito-panel-header">
              <h3>Tu pedido</h3>
              <button className="btn-cerrar" onClick={() => setCarritoAbierto(false)}>✕</button>
            </div>
            <div className="carrito-items">
              {carrito.map(item => (
                <div key={item.clave} className="carrito-item">
                  <div className="carrito-item-info">
                    <div className="carrito-item-nombre">{item.nombre}</div>
                    {item.variante && <div className="carrito-item-variante">{item.variante}</div>}
                    <div className="carrito-item-precio">${(item.precio * item.cantidad).toLocaleString('es-AR')}</div>
                  </div>
                  <div className="carrito-item-cantidad">
                    <button onClick={() => cambiarCantidad(item.clave, -1)}>−</button>
                    <span>{item.cantidad}</span>
                    <button onClick={() => cambiarCantidad(item.clave, 1)}>+</button>
                    <button onClick={() => eliminarItem(item.clave)}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="carrito-footer">
              <div className="carrito-total">
                <span>Total</span>
                <strong>${totalCarrito.toLocaleString('es-AR')}</strong>
              </div>
              <button className="btn-whatsapp" onClick={enviarWhatsApp} disabled={carrito.length === 0}>
                Enviar pedido por WhatsApp
              </button>
            </div>
          </div>
        )}

        <button className="carrito-btn" onClick={() => setCarritoAbierto(!carritoAbierto)}>
          🛒 Mi pedido
          {cantidadItems > 0 && <span className="carrito-badge">{cantidadItems}</span>}
        </button>
      </div>

    </div>
  )
}

export default Catalogo