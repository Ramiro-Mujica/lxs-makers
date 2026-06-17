import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/inicio.css'

function Inicio() {
  const navigate = useNavigate()
  const [codigo, setCodigo]           = useState('')
  const [codigoSeg, setCodigoSeg]     = useState('')
  const [seguimiento, setSeguimiento] = useState(null)
  const [errorSeg, setErrorSeg]       = useState('')
  const [cargandoSeg, setCargandoSeg] = useState(false)

  const handleCatalogo = (e) => {
    e.preventDefault()
    if (!codigo.trim()) return
    navigate(`/catalogo/${codigo.trim().toUpperCase()}`)
  }

  const handleSeguimiento = async (e) => {
    e.preventDefault()
    if (!codigoSeg.trim()) return
    setErrorSeg('')
    setSeguimiento(null)
    setCargandoSeg(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'}/pedidos/seguimiento/${codigoSeg.trim().toUpperCase()}/`)
      const data = await res.json()
      if (!res.ok) {
        setErrorSeg(data.error || 'Pedido no encontrado.')
      } else {
        setSeguimiento(data)
      }
    } catch {
      setErrorSeg('Error al consultar el pedido.')
    } finally {
      setCargandoSeg(false)
    }
  }

  const badgeEstado = (estado) => {
    const colores = {
      pendiente:  '#f6c23e',
      en_proceso: '#36b9cc',
      enviado:    '#4e73df',
      completado: '#1cc88a',
    }
    return colores[estado] || '#858796'
  }

  return (
    <div className="inicio-wrapper">

      <nav className="inicio-nav">
        <span className="inicio-nav-brand">LXS Makers</span>
        <div className="inicio-nav-links">
          <Link to="/login" className="link-nav-btn link-nav-outline">Iniciar sesión</Link>
          <Link to="/registro" className="link-nav-btn">Registrarse</Link>
        </div>
      </nav>

      <div className="inicio-hero">
        <span className="inicio-hero-badge">Sistema de gestión comercial para emprendedores</span>

        <h1>Tu tienda, tu privacidad, <span>tu ventaja</span></h1>

        <p>
          LXS Makers protege tu catálogo y tus precios. Tus clientes te encuentran a vos,
          no a tu competencia. Sin registro, sin fricción, sin exposición.
        </p>

        <div className="inicio-accesos">
          <div className="inicio-catalogo">
            <p>¿Recibiste un código de catálogo? Ingresalo acá</p>
            <form className="inicio-catalogo-form" onSubmit={handleCatalogo}>
              <input
                type="text"
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Ej: AB3X9K2M"
                maxLength={8}
              />
              <button className="btn-hero-primary" type="submit">
                Ver catálogo
              </button>
            </form>
          </div>

          <div className="inicio-catalogo">
            <p>¿Querés saber el estado de tu pedido?</p>
            <form className="inicio-catalogo-form" onSubmit={handleSeguimiento}>
              <input
                type="text"
                value={codigoSeg}
                onChange={e => setCodigoSeg(e.target.value)}
                placeholder="Código de seguimiento"
                maxLength={8}
              />
              <button className="btn-hero-primary" type="submit" disabled={cargandoSeg}>
                {cargandoSeg ? '...' : 'Consultar'}
              </button>
            </form>
            {errorSeg && <p className="seguimiento-error">{errorSeg}</p>}
            {seguimiento && (
              <div className="seguimiento-resultado">
                <div className="seguimiento-header">
                  <span>Pedido <strong>{seguimiento.codigo_seguimiento}</strong></span>
                  <span className="seguimiento-estado" style={{ color: badgeEstado(seguimiento.estado) }}>
                    {seguimiento.estado.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="seguimiento-detalles">
                  {seguimiento.detalles?.map((d, i) => (
                    <div key={i} className="seguimiento-item">
                      <span>{d.nombre_producto} {d.variante !== '-' ? `(${d.variante})` : ''} × {d.cantidad}</span>
                      <span>${Number(d.subtotal).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
                <div className="seguimiento-total">
                  <span>Total</span>
                  <strong>${Number(seguimiento.total).toLocaleString('es-AR')}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="inicio-features">
        <div className="feature-item">
          <span className="feature-icono">🔒</span>
          <strong>Privacidad total</strong>
          <p>Tu catálogo solo lo ven quienes tienen tu código. Tu competencia no puede encontrarte.</p>
        </div>
        <div className="feature-item">
          <span className="feature-icono">📦</span>
          <strong>Catálogo profesional</strong>
          <p>Fotos optimizadas, variantes, precios y estados. Todo lo que necesitás para vender.</p>
        </div>
        <div className="feature-item">
          <span className="feature-icono">💬</span>
          <strong>Pedidos por WhatsApp</strong>
          <p>Tus clientes arman su pedido y te lo mandan directo. Sin intermediarios ni comisiones.</p>
        </div>
        <div className="feature-item">
          <span className="feature-icono">📊</span>
          <strong>Estadísticas reales</strong>
          <p>Sabé cuánto ganás, qué se vende más y cuándo conviene reponer stock.</p>
        </div>
        <div className="feature-item">
          <span className="feature-icono">📌</span>
          <strong>Organización interna</strong>
          <p>Tableros Kanban para tus tareas y pedidos. Todo en un solo lugar.</p>
        </div>
        <div className="feature-item">
          <span className="feature-icono">🚀</span>
          <strong>Sin registro para clientes</strong>
          <p>Tus clientes compran sin crear una cuenta. Menos fricción, más ventas.</p>
        </div>
      </div>

      <footer className="inicio-footer">
        LXS Makers — Sistema de gestión comercial para emprendedores · {new Date().getFullYear()}
      </footer>

    </div>
  )
}

export default Inicio