// frontend/src/pages/Catalogo.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

const API = "http://127.0.0.1:8000";

function Catalogo() {
  const { codigo }         = useParams();
  const [tienda,           setTienda]           = useState(null);
  const [productos,        setProductos]         = useState([]);
  const [carrito,          setCarrito]           = useState([]);
  const [carritoAbierto,   setCarritoAbierto]    = useState(false);
  const [productoActivo,   setProductoActivo]    = useState(null);
  const [error,            setError]             = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        const res  = await fetch(`${API}/catalogo/${codigo}`);
        const data = await res.json();
        if (!res.ok) { setError(data.detail); return; }
        setTienda(data.tienda);
        setProductos(data.productos);
      } catch {
        setError("No se pudo cargar el catálogo.");
      }
    };
    cargar();
  }, [codigo]);

  const agregarAlCarrito = (producto, variante = null) => {
    setCarrito((actual) => {
      const existente = actual.find(
        (i) => i.producto_id === producto.id && i.variante === variante
      );
      if (existente) {
        return actual.map((i) =>
          i.producto_id === producto.id && i.variante === variante
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...actual, {
        producto_id: producto.id,
        nombre:      producto.nombre,
        precio:      producto.precio,
        variante,
        cantidad:    1,
      }];
    });
    setProductoActivo(null);
  };

  const quitarDelCarrito = (producto_id, variante) => {
    setCarrito((actual) => actual.filter((i) => !(i.producto_id === producto_id && i.variante === variante)));
  };

  const totalCarrito    = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  const cantidadCarrito = carrito.reduce((acc, i) => acc + i.cantidad, 0);

  const enviarPorWhatsApp = () => {
    if (!tienda?.whatsapp || carrito.length === 0) return;
    const lineas  = carrito.map(
      (i) => `• ${i.nombre}${i.variante ? ` (${i.variante})` : ""} x${i.cantidad} = $${(i.precio * i.cantidad).toFixed(2)}`
    );
    const mensaje = `Hola ${tienda.nombre_negocio}! Quiero hacer un pedido:\n\n${lineas.join("\n")}\n\nTotal: $${totalCarrito.toFixed(2)}`;
    window.open(`https://wa.me/${tienda.whatsapp}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  if (error) return (
    <div className="center-page">
      <div className="card auth-card" style={{ maxWidth: "420px", width: "100%", textAlign: "center" }}>
        <p className="msg-error">{error}</p>
        <Link to="/" className="link-accent">← Volver al inicio</Link>
      </div>
    </div>
  );

  if (!tienda) return <div className="center-page"><div className="card auth-card">Cargando catálogo...</div></div>;

  return (
    <div className="catalog-page page-shell">
      <div className="page-container">
        <header className="catalog-header">
          <h1 className="section-title">{tienda.nombre_negocio}</h1>
          {tienda.descripcion && <p className="section-subtitle" style={{ maxWidth: "760px", margin: "0.75rem auto 0" }}>{tienda.descripcion}</p>}
          <div style={{ marginTop: "1rem" }}>
            <span className="badge badge-info">Código: {tienda.codigo_catalogo}</span>
          </div>
        </header>

        <div className="catalog-grid">
          {productos.length === 0 && <p className="empty-state">Esta tienda no tiene productos visibles aún.</p>}
          {productos.map((p) => (
            <article key={p.id} className="card product-card" onClick={() => setProductoActivo(p)}>
              {p.imagenes.length > 0 ? (
                <img src={p.imagenes[0].url} alt={p.nombre} className="product-card__image" />
              ) : (
                <div className="product-card__placeholder">📦</div>
              )}
              <div className="product-card__body">
                <strong className="product-card__name">{p.nombre}</strong>
                <span className="product-card__price">${p.precio.toFixed(2)}</span>
                {p.variantes.length === 0 ? (
                  <button
                    className="btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      agregarAlCarrito(p);
                    }}
                  >
                    Agregar
                  </button>
                ) : (
                  <span className="product-card__cta">Ver opciones →</span>
                )}
              </div>
            </article>
          ))}
        </div>

        {productoActivo && (
          <div className="overlay" onClick={() => setProductoActivo(null)}>
            <div className="card modal" onClick={(e) => e.stopPropagation()}>
              <button className="btn-ghost modal__close" onClick={() => setProductoActivo(null)}>✕</button>

              {productoActivo.imagenes.length > 0 ? (
                <img src={productoActivo.imagenes[0].url} alt={productoActivo.nombre} className="modal__image" />
              ) : (
                <div className="modal__placeholder">📦</div>
              )}

              <div className="modal__content">
                <h2 className="modal__title">{productoActivo.nombre}</h2>
                <span className="modal__price">${productoActivo.precio.toFixed(2)}</span>
                {productoActivo.descripcion && <p className="section-subtitle">{productoActivo.descripcion}</p>}

                {productoActivo.variantes.length > 0 ? (
                  <div className="list-grid">
                    {[...new Set(productoActivo.variantes.map((v) => v.tipo))].map((tipo) => (
                      <div key={tipo} className="list-grid">
                        <p className="text-muted" style={{ fontSize: "0.85rem", fontWeight: 700 }}>{tipo}</p>
                        <div className="flex-row">
                          {productoActivo.variantes
                            .filter((v) => v.tipo === tipo)
                            .map((v, i) => (
                              <button
                                key={i}
                                className="btn-secondary"
                                onClick={() => agregarAlCarrito(productoActivo, `${tipo}: ${v.valor}`)}
                              >
                                {v.valor}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button className="btn-primary" onClick={() => agregarAlCarrito(productoActivo)}>
                    Agregar al carrito
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {cantidadCarrito > 0 && (
          <div className="catalog-floating-cart">
            <button className="btn-primary cart-button" onClick={() => setCarritoAbierto(!carritoAbierto)}>
              🛒 {cantidadCarrito} - ${totalCarrito.toFixed(2)}
            </button>

            {carritoAbierto && (
              <div className="card cart-panel">
                <h3 className="section-title" style={{ fontSize: "1.1rem" }}>Tu pedido</h3>
                <div className="cart-list">
                  {carrito.map((i, idx) => (
                    <div key={idx} className="cart-item">
                      <div>
                        <div>{i.nombre}{i.variante ? ` (${i.variante})` : ""}</div>
                        <div className="text-muted" style={{ fontSize: "0.82rem" }}>x{i.cantidad} - ${(i.precio * i.cantidad).toFixed(2)}</div>
                      </div>
                      <button className="btn-ghost" onClick={() => quitarDelCarrito(i.producto_id, i.variante)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="cart-total">
                  <strong>Total: ${totalCarrito.toFixed(2)}</strong>
                </div>
                <button className="btn-whatsapp" onClick={enviarPorWhatsApp}>
                  📲 Enviar pedido por WhatsApp
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Catalogo;