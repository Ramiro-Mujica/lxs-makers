// frontend/src/pages/Catalogo.jsx
// Vista pública del catálogo de una tienda — no requiere login
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

const API = "http://127.0.0.1:8000";

function Catalogo() {
  const { codigo }      = useParams();
  const [tienda,        setTienda]        = useState(null);
  const [productos,     setProductos]     = useState([]);
  const [carrito,       setCarrito]       = useState([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [error,         setError]         = useState("");

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
    const existente = carrito.find(
      (i) => i.producto_id === producto.id && i.variante === variante
    );
    if (existente) {
      setCarrito(carrito.map((i) =>
        i.producto_id === producto.id && i.variante === variante
          ? { ...i, cantidad: i.cantidad + 1 }
          : i
      ));
    } else {
      setCarrito([...carrito, {
        producto_id: producto.id,
        nombre:      producto.nombre,
        precio:      producto.precio,
        variante,
        cantidad:    1,
      }]);
    }
  };

  const totalCarrito = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);

  const enviarPorWhatsApp = () => {
    if (!tienda?.whatsapp || carrito.length === 0) return;
    const lineas = carrito.map(
      (i) => `• ${i.nombre}${i.variante ? ` (${i.variante})` : ""} x${i.cantidad} = $${(i.precio * i.cantidad).toFixed(2)}`
    );
    const mensaje = `Hola! Quiero hacer un pedido:\n\n${lineas.join("\n")}\n\nTotal: $${totalCarrito.toFixed(2)}`;
    window.open(`https://wa.me/${tienda.whatsapp}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  if (error) return (
    <div style={styles.container}>
      <p style={styles.error}>{error}</p>
      <Link to="/" style={styles.link}>← Volver al inicio</Link>
    </div>
  );

  if (!tienda) return <div style={styles.container}><p>Cargando catálogo...</p></div>;

  return (
    <div style={styles.container}>
      {/* Header de la tienda */}
      <div style={styles.header}>
        <h1 style={styles.nombreTienda}>{tienda.nombre_negocio}</h1>
        <p style={styles.codigo}>Código: {tienda.codigo_catalogo}</p>
      </div>

      {/* Grilla de productos */}
      <div style={styles.grilla}>
        {productos.length === 0 && <p style={styles.vacio}>Esta tienda no tiene productos visibles aún.</p>}
        {productos.map((p) => (
          <div key={p.id} style={styles.productoCard}>
            {/* Imagen principal */}
            {p.imagenes.length > 0 ? (
              <img
                src={p.imagenes[0].url}
                alt={p.nombre}
                style={styles.imagen}
              />
            ) : (
              <div style={styles.sinImagen}>Sin imagen</div>
            )}
            <div style={styles.productoInfo}>
              <strong style={styles.nombreProducto}>{p.nombre}</strong>
              <span style={styles.precio}>${p.precio}</span>
              {p.descripcion && <span style={styles.desc}>{p.descripcion}</span>}

              {/* Variantes */}
              {p.variantes.length > 0 ? (
                <div style={styles.variantesRow}>
                  {[...new Set(p.variantes.map((v) => v.tipo))].map((tipo) => (
                    <div key={tipo}>
                      <span style={styles.tipoVariante}>{tipo}:</span>
                      <div style={styles.valoresRow}>
                        {p.variantes
                          .filter((v) => v.tipo === tipo)
                          .map((v, i) => (
                            <button
                              key={i}
                              style={styles.btnVariante}
                              onClick={() => agregarAlCarrito(p, `${tipo}: ${v.valor}`)}
                            >
                              {v.valor}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button style={styles.btnAgregar} onClick={() => agregarAlCarrito(p)}>
                  Agregar al carrito
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Carrito flotante */}
      {carrito.length > 0 && (
        <div style={styles.carritoFlotante}>
          <button
            style={styles.btnCarrito}
            onClick={() => setCarritoAbierto(!carritoAbierto)}
          >
            🛒 {carrito.reduce((acc, i) => acc + i.cantidad, 0)} — ${totalCarrito.toFixed(2)}
          </button>

          {carritoAbierto && (
            <div style={styles.carritoPanel}>
              <h3 style={styles.carritoTitulo}>Tu pedido</h3>
              {carrito.map((i, idx) => (
                <div key={idx} style={styles.carritoItem}>
                  <span>{i.nombre}{i.variante ? ` (${i.variante})` : ""} x{i.cantidad}</span>
                  <span>${(i.precio * i.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div style={styles.carritoTotal}>
                <strong>Total: ${totalCarrito.toFixed(2)}</strong>
              </div>
              <button style={styles.btnWhatsapp} onClick={enviarPorWhatsApp}>
                📲 Enviar por WhatsApp
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container:       { maxWidth: "1100px", margin: "2rem auto", padding: "0 1rem" },
  header:          { textAlign: "center", marginBottom: "2rem" },
  nombreTienda:    { fontSize: "2rem", color: "#1a1a2e" },
  codigo:          { color: "#666", fontSize: "0.9rem" },
  grilla:          { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" },
  productoCard:    { backgroundColor: "#f9f9f9", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  imagen:          { width: "100%", height: "200px", objectFit: "cover" },
  sinImagen:       { width: "100%", height: "200px", backgroundColor: "#e9ecef", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" },
  productoInfo:    { padding: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem" },
  nombreProducto:  { fontSize: "1.1rem", color: "#1a1a2e" },
  precio:          { color: "#e94560", fontWeight: "bold", fontSize: "1.1rem" },
  desc:            { color: "#666", fontSize: "0.85rem" },
  variantesRow:    { display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem" },
  tipoVariante:    { fontSize: "0.85rem", color: "#666", fontWeight: "bold" },
  valoresRow:      { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  btnVariante:     { backgroundColor: "#1a1a2e", color: "#fff", border: "none", borderRadius: "6px", padding: "0.3rem 0.8rem", cursor: "pointer", fontSize: "0.85rem" },
  btnAgregar:      { backgroundColor: "#e94560", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem", cursor: "pointer", fontSize: "0.9rem", marginTop: "0.5rem" },
  carritoFlotante: { position: "fixed", bottom: "2rem", right: "2rem", zIndex: 100 },
  btnCarrito:      { backgroundColor: "#1a1a2e", color: "#fff", border: "none", borderRadius: "50px", padding: "0.75rem 1.5rem", fontSize: "1rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" },
  carritoPanel:    { backgroundColor: "#fff", borderRadius: "12px", padding: "1.25rem", marginTop: "0.5rem", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", minWidth: "280px" },
  carritoTitulo:   { margin: "0 0 1rem", color: "#1a1a2e" },
  carritoItem:     { display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "0.4rem" },
  carritoTotal:    { borderTop: "1px solid #eee", paddingTop: "0.75rem", marginTop: "0.5rem", textAlign: "right" },
  btnWhatsapp:     { backgroundColor: "#25D366", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem", fontSize: "1rem", cursor: "pointer", width: "100%", marginTop: "0.75rem" },
  vacio:           { color: "#666", textAlign: "center", padding: "3rem", gridColumn: "1/-1" },
  error:           { color: "#e94560", textAlign: "center", fontSize: "1.1rem" },
  link:            { display: "block", textAlign: "center", color: "#e94560", marginTop: "1rem" },
};

export default Catalogo;
