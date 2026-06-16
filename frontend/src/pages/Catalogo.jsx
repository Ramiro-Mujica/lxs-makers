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
    setProductoActivo(null);
  };

  const quitarDelCarrito = (producto_id, variante) => {
    setCarrito(carrito.filter((i) => !(i.producto_id === producto_id && i.variante === variante)));
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
    <div style={styles.centrado}>
      <p style={styles.error}>{error}</p>
      <Link to="/" style={styles.link}>← Volver al inicio</Link>
    </div>
  );

  if (!tienda) return <div style={styles.centrado}><p>Cargando catálogo...</p></div>;

  return (
    <div style={styles.container}>

      {/* Header tienda */}
      <div style={styles.header}>
        <h1 style={styles.nombreTienda}>{tienda.nombre_negocio}</h1>
        {tienda.descripcion && <p style={styles.descripcionTienda}>{tienda.descripcion}</p>}
        <span style={styles.codigoBadge}>Código: {tienda.codigo_catalogo}</span>
      </div>

      {/* Grilla productos */}
      <div style={styles.grilla}>
        {productos.length === 0 && (
          <p style={styles.vacio}>Esta tienda no tiene productos visibles aún.</p>
        )}
        {productos.map((p) => (
          <div
            key={p.id}
            style={styles.productoCard}
            onClick={() => setProductoActivo(p)}
          >
            {p.imagenes.length > 0 ? (
              <img src={p.imagenes[0].url} alt={p.nombre} style={styles.imagen} />
            ) : (
              <div style={styles.sinImagen}>📦</div>
            )}
            <div style={styles.productoInfo}>
              <strong style={styles.nombreProducto}>{p.nombre}</strong>
              <span style={styles.precio}>${p.precio.toFixed(2)}</span>
              {p.variantes.length === 0 && (
                <button
                  style={styles.btnAgregar}
                  onClick={(e) => { e.stopPropagation(); agregarAlCarrito(p); }}
                >
                  Agregar
                </button>
              )}
              {p.variantes.length > 0 && (
                <span style={styles.verOpciones}>Ver opciones →</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal producto */}
      {productoActivo && (
        <div style={styles.overlay} onClick={() => setProductoActivo(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.btnCerrar} onClick={() => setProductoActivo(null)}>✕</button>

            {productoActivo.imagenes.length > 0 ? (
              <img src={productoActivo.imagenes[0].url} alt={productoActivo.nombre} style={styles.modalImagen} />
            ) : (
              <div style={styles.modalSinImagen}>📦</div>
            )}

            <h2 style={styles.modalNombre}>{productoActivo.nombre}</h2>
            <span style={styles.modalPrecio}>${productoActivo.precio.toFixed(2)}</span>
            {productoActivo.descripcion && (
              <p style={styles.modalDesc}>{productoActivo.descripcion}</p>
            )}

            {productoActivo.variantes.length > 0 ? (
              <div style={styles.variantesSection}>
                {[...new Set(productoActivo.variantes.map((v) => v.tipo))].map((tipo) => (
                  <div key={tipo}>
                    <p style={styles.tipoVariante}>{tipo}:</p>
                    <div style={styles.valoresRow}>
                      {productoActivo.variantes
                        .filter((v) => v.tipo === tipo)
                        .map((v, i) => (
                          <button
                            key={i}
                            style={styles.btnVariante}
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
              <button style={styles.btnAgregarModal} onClick={() => agregarAlCarrito(productoActivo)}>
                Agregar al carrito
              </button>
            )}
          </div>
        </div>
      )}

      {/* Carrito flotante */}
      {cantidadCarrito > 0 && (
        <div style={styles.carritoFlotante}>
          <button style={styles.btnCarrito} onClick={() => setCarritoAbierto(!carritoAbierto)}>
            🛒 {cantidadCarrito} — ${totalCarrito.toFixed(2)}
          </button>

          {carritoAbierto && (
            <div style={styles.carritoPanel}>
              <h3 style={styles.carritoTitulo}>Tu pedido</h3>
              {carrito.map((i, idx) => (
                <div key={idx} style={styles.carritoItem}>
                  <div style={styles.carritoItemInfo}>
                    <span>{i.nombre}{i.variante ? ` (${i.variante})` : ""}</span>
                    <span style={styles.carritoItemPrecio}>x{i.cantidad} — ${(i.precio * i.cantidad).toFixed(2)}</span>
                  </div>
                  <button style={styles.btnQuitarItem} onClick={() => quitarDelCarrito(i.producto_id, i.variante)}>✕</button>
                </div>
              ))}
              <div style={styles.carritoTotal}>
                <strong>Total: ${totalCarrito.toFixed(2)}</strong>
              </div>
              <button style={styles.btnWhatsapp} onClick={enviarPorWhatsApp}>
                📲 Enviar pedido por WhatsApp
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container:          { maxWidth: "1100px", margin: "0 auto", padding: "0 1rem 6rem" },
  centrado:           { textAlign: "center", padding: "4rem 1rem" },
  header:             { textAlign: "center", padding: "2.5rem 1rem", borderBottom: "1px solid #eee", marginBottom: "2rem" },
  nombreTienda:       { fontSize: "2rem", color: "#1a1a2e", margin: "0 0 0.5rem" },
  descripcionTienda:  { color: "#666", fontSize: "1rem", maxWidth: "600px", margin: "0 auto 1rem", lineHeight: "1.6" },
  codigoBadge:        { display: "inline-block", backgroundColor: "#f0f0f0", color: "#666", borderRadius: "20px", padding: "0.25rem 0.75rem", fontSize: "0.8rem" },
  grilla:             { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" },
  productoCard:       { backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer", transition: "transform 0.2s", border: "1px solid #f0f0f0" },
  imagen:             { width: "100%", height: "200px", objectFit: "cover" },
  sinImagen:          { width: "100%", height: "200px", backgroundColor: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" },
  productoInfo:       { padding: "0.75rem 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.35rem" },
  nombreProducto:     { fontSize: "1rem", color: "#1a1a2e" },
  precio:             { color: "#e94560", fontWeight: "bold", fontSize: "1.1rem" },
  btnAgregar:         { backgroundColor: "#e94560", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem", cursor: "pointer", fontSize: "0.9rem", marginTop: "0.25rem" },
  verOpciones:        { color: "#e94560", fontSize: "0.85rem", cursor: "pointer" },
  overlay:            { position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "1rem" },
  modal:              { backgroundColor: "#fff", borderRadius: "16px", padding: "1.5rem", maxWidth: "480px", width: "100%", position: "relative", maxHeight: "90vh", overflowY: "auto" },
  btnCerrar:          { position: "absolute", top: "1rem", right: "1rem", background: "#f0f0f0", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "1rem" },
  modalImagen:        { width: "100%", height: "250px", objectFit: "cover", borderRadius: "12px", marginBottom: "1rem" },
  modalSinImagen:     { width: "100%", height: "150px", backgroundColor: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "4rem", borderRadius: "12px", marginBottom: "1rem" },
  modalNombre:        { fontSize: "1.4rem", color: "#1a1a2e", margin: "0 0 0.25rem" },
  modalPrecio:        { color: "#e94560", fontWeight: "bold", fontSize: "1.3rem", display: "block", marginBottom: "0.75rem" },
  modalDesc:          { color: "#666", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "1rem" },
  variantesSection:   { display: "flex", flexDirection: "column", gap: "0.75rem" },
  tipoVariante:       { margin: "0 0 0.4rem", fontWeight: "bold", color: "#1a1a2e", fontSize: "0.9rem" },
  valoresRow:         { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  btnVariante:        { backgroundColor: "#1a1a2e", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.9rem" },
  btnAgregarModal:    { backgroundColor: "#e94560", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem", fontSize: "1rem", cursor: "pointer", width: "100%", marginTop: "1rem" },
  carritoFlotante:    { position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 100 },
  btnCarrito:         { backgroundColor: "#1a1a2e", color: "#fff", border: "none", borderRadius: "50px", padding: "0.75rem 1.5rem", fontSize: "1rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" },
  carritoPanel:       { backgroundColor: "#fff", borderRadius: "12px", padding: "1.25rem", marginTop: "0.5rem", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", minWidth: "300px", maxHeight: "70vh", overflowY: "auto" },
  carritoTitulo:      { margin: "0 0 1rem", color: "#1a1a2e" },
  carritoItem:        { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid #f0f0f0" },
  carritoItemInfo:    { display: "flex", flexDirection: "column", gap: "0.1rem" },
  carritoItemPrecio:  { color: "#e94560", fontSize: "0.85rem", fontWeight: "bold" },
  btnQuitarItem:      { background: "none", border: "none", color: "#999", cursor: "pointer", fontSize: "0.9rem" },
  carritoTotal:       { textAlign: "right", padding: "0.75rem 0", borderTop: "2px solid #eee", marginTop: "0.5rem" },
  btnWhatsapp:        { backgroundColor: "#25D366", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem", fontSize: "1rem", cursor: "pointer", width: "100%", marginTop: "0.75rem" },
  vacio:              { color: "#666", textAlign: "center", padding: "3rem", gridColumn: "1/-1" },
  error:              { color: "#e94560", fontSize: "1.1rem" },
  link:               { color: "#e94560", textDecoration: "none" },
};

export default Catalogo;