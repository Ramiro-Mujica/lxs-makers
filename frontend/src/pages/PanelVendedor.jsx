// frontend/src/pages/PanelVendedor.jsx
import { useState, useEffect } from "react";

const API = "http://127.0.0.1:8000";

function PanelVendedor() {
  const vendedorId = localStorage.getItem("userId");

  const [seccion,   setSeccion]   = useState("catalogo");
  const [productos, setProductos] = useState([]);
  const [mensaje,   setMensaje]   = useState("");
  const [form, setForm] = useState({
    nombre: "", precio: "", descripcion: "", variantes: []
  });
  const [nuevaVariante, setNuevaVariante] = useState({ tipo: "", valor: "" });

  const cargarProductos = async () => {
    const res  = await fetch(`${API}/productos/vendedor/${vendedorId}`);
    const data = await res.json();
    setProductos(data);
  };

  useEffect(() => {
    if (vendedorId) cargarProductos();
  }, [vendedorId]);

  const agregarVariante = () => {
    if (!nuevaVariante.tipo || !nuevaVariante.valor) return;
    setForm({ ...form, variantes: [...form.variantes, { ...nuevaVariante }] });
    setNuevaVariante({ tipo: "", valor: "" });
  };

  const crearProducto = async () => {
    if (!form.nombre || !form.precio) {
      setMensaje("Nombre y precio son obligatorios.");
      return;
    }
    const res = await fetch(`${API}/productos/vendedor/${vendedorId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre:      form.nombre,
        precio:      parseFloat(form.precio),
        descripcion: form.descripcion,
        variantes:   form.variantes,
      }),
    });
    const data = await res.json();
    setMensaje(data.mensaje || data.detail);
    setForm({ nombre: "", precio: "", descripcion: "", variantes: [] });
    cargarProductos();
  };

  const eliminarProducto = async (id) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const res  = await fetch(`${API}/productos/${id}`, { method: "DELETE" });
    const data = await res.json();
    setMensaje(data.mensaje || data.detail);
    cargarProductos();
  };

  const cambiarEstadoProducto = async (id, estado) => {
    const res = await fetch(`${API}/productos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    const data = await res.json();
    setMensaje(data.mensaje || data.detail);
    cargarProductos();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Panel del Vendedor</h1>

      {/* Navegación de secciones */}
      <div style={styles.tabs}>
        {["catalogo", "pedidos", "tableros", "estadisticas"].map((s) => (
          <button
            key={s}
            style={seccion === s ? styles.tabActivo : styles.tab}
            onClick={() => setSeccion(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}

      {/* Sección Catálogo */}
      {seccion === "catalogo" && (
        <div>
          <h2 style={styles.subtitulo}>Mis productos</h2>

          <div style={styles.card}>
            <h3 style={styles.cardTitulo}>Agregar producto</h3>
            <input
              style={styles.input}
              placeholder="Nombre del producto"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="Precio"
              type="number"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
            />
            <textarea
              style={styles.textarea}
              placeholder="Descripción (opcional)"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
            <div style={styles.variantesRow}>
              <input
                style={styles.inputSmall}
                placeholder="Tipo (ej: Talle)"
                value={nuevaVariante.tipo}
                onChange={(e) => setNuevaVariante({ ...nuevaVariante, tipo: e.target.value })}
              />
              <input
                style={styles.inputSmall}
                placeholder="Valor (ej: M)"
                value={nuevaVariante.valor}
                onChange={(e) => setNuevaVariante({ ...nuevaVariante, valor: e.target.value })}
              />
              <button style={styles.btnSecundario} onClick={agregarVariante}>
                + Variante
              </button>
            </div>
            {form.variantes.length > 0 && (
              <div style={styles.variantesList}>
                {form.variantes.map((v, i) => (
                  <span key={i} style={styles.varianteBadge}>
                    {v.tipo}: {v.valor}
                  </span>
                ))}
              </div>
            )}
            <button style={styles.btnPrimario} onClick={crearProducto}>
              Crear producto
            </button>
          </div>

          <div style={styles.listaProductos}>
            {productos.length === 0 && (
              <p style={styles.vacio}>No tenés productos aún.</p>
            )}
            {productos.map((p) => (
              <div key={p.id} style={styles.productoCard}>
                <div style={styles.productoInfo}>
                  <strong>{p.nombre}</strong>
                  <span style={styles.precio}>${p.precio}</span>
                  {p.descripcion && <span style={styles.desc}>{p.descripcion}</span>}
                  <span style={estadoColor(p.estado)}>{p.estado.toUpperCase()}</span>
                  {p.variantes.length > 0 && (
                    <div style={styles.variantesList}>
                      {p.variantes.map((v, i) => (
                        <span key={i} style={styles.varianteBadge}>
                          {v.tipo}: {v.valor}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={styles.productoAcciones}>
                  <select
                    style={styles.select}
                    value={p.estado}
                    onChange={(e) => cambiarEstadoProducto(p.id, e.target.value)}
                  >
                    <option value="visible">Visible</option>
                    <option value="sin_stock">Sin stock</option>
                    <option value="oculto">Oculto</option>
                  </select>
                  <button
                    style={styles.btnEliminar}
                    onClick={() => eliminarProducto(p.id)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {seccion === "pedidos"      && <SeccionPedidos vendedorId={vendedorId} />}
      {seccion === "tableros"     && <p style={styles.proximamente}>Próximamente — Tableros Kanban</p>}
      {seccion === "estadisticas" && <p style={styles.proximamente}>Próximamente — Estadísticas</p>}
    </div>
  );
}

function SeccionPedidos({ vendedorId }) {
  const [pedidos, setPedidos] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const cargarPedidos = async () => {
    const res  = await fetch(`${API}/pedidos/vendedor/${vendedorId}`);
    const data = await res.json();
    setPedidos(data);
  };

  useEffect(() => { cargarPedidos(); }, []);

  const cambiarEstado = async (id, estado, comentario = "") => {
    const res = await fetch(`${API}/pedidos/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado_pedido: estado, comentario }),
    });
    const data = await res.json();
    setMensaje(data.mensaje || data.detail);
    cargarPedidos();
  };

  const colorEstado = (estado) => ({
    pendiente:  { bg: "#fff3cd", color: "#856404" },
    en_proceso: { bg: "#cce5ff", color: "#004085" },
    enviado:    { bg: "#d4edda", color: "#155724" },
    entregado:  { bg: "#e2e3e5", color: "#383d41" },
  }[estado] || { bg: "#f8f9fa", color: "#333" });

  return (
    <div>
      <h2 style={styles.subtitulo}>Mis pedidos</h2>
      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}
      {pedidos.length === 0 && <p style={styles.vacio}>No tenés pedidos activos.</p>}
      {pedidos.map((p) => {
        const c = colorEstado(p.estado_pedido);
        return (
          <div key={p.id} style={styles.productoCard}>
            <div style={styles.productoInfo}>
              <strong>Código: {p.codigo_seguimiento}</strong>
              <span style={{ ...styles.estadoBadge, backgroundColor: c.bg, color: c.color }}>
                {p.estado_pedido.replace("_", " ").toUpperCase()}
              </span>
              <span style={styles.precio}>Total: ${p.total}</span>
              <span style={styles.desc}>Vence en {p.dias_restantes} día(s)</span>
              {p.comentario && <span style={styles.desc}>Comentario: {p.comentario}</span>}
            </div>
            <div style={styles.productoAcciones}>
              <select
                style={styles.select}
                value={p.estado_pedido}
                onChange={(e) => {
                  const comentario = e.target.value === "enviado"
                    ? prompt("Agregá un comentario (opcional):") || ""
                    : "";
                  cambiarEstado(p.id, e.target.value, comentario);
                }}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const estadoColor = (estado) => ({
  ...styles.estadoBadge,
  backgroundColor:
    estado === "visible"   ? "#d4edda" :
    estado === "sin_stock" ? "#fff3cd" : "#f8d7da",
  color:
    estado === "visible"   ? "#155724" :
    estado === "sin_stock" ? "#856404" : "#721c24",
});

const styles = {
  container:        { maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" },
  titulo:           { color: "#1a1a2e", fontSize: "1.8rem", marginBottom: "1rem" },
  subtitulo:        { color: "#1a1a2e", fontSize: "1.3rem", margin: "1.5rem 0 1rem" },
  tabs:             { display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" },
  tab:              { backgroundColor: "#f0f0f0", border: "none", borderRadius: "8px", padding: "0.5rem 1.25rem", cursor: "pointer", fontSize: "0.95rem" },
  tabActivo:        { backgroundColor: "#e94560", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1.25rem", cursor: "pointer", fontSize: "0.95rem" },
  mensaje:          { backgroundColor: "#d4edda", color: "#155724", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" },
  card:             { backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" },
  cardTitulo:       { margin: 0, color: "#1a1a2e" },
  input:            { padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", boxSizing: "border-box" },
  inputSmall:       { padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.9rem", flex: 1 },
  textarea:         { padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", minHeight: "80px", resize: "vertical" },
  variantesRow:     { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  variantesList:    { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  varianteBadge:    { backgroundColor: "#e9ecef", borderRadius: "6px", padding: "0.2rem 0.6rem", fontSize: "0.85rem" },
  btnPrimario:      { backgroundColor: "#e94560", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem", fontSize: "1rem", cursor: "pointer" },
  btnSecundario:    { backgroundColor: "#1a1a2e", color: "#fff", border: "none", borderRadius: "8px", padding: "0.6rem 1rem", fontSize: "0.9rem", cursor: "pointer" },
  btnEliminar:      { backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.9rem" },
  listaProductos:   { display: "flex", flexDirection: "column", gap: "1rem" },
  productoCard:     { backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  productoInfo:     { display: "flex", flexDirection: "column", gap: "0.25rem" },
  precio:           { color: "#e94560", fontWeight: "bold" },
  desc:             { color: "#666", fontSize: "0.9rem" },
  estadoBadge:      { display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", width: "fit-content" },
  productoAcciones: { display: "flex", gap: "0.5rem", flexDirection: "column" },
  select:           { padding: "0.5rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.9rem" },
  vacio:            { color: "#666", textAlign: "center", padding: "2rem" },
  proximamente:     { color: "#666", textAlign: "center", padding: "3rem", fontSize: "1.1rem" },
};

export default PanelVendedor;