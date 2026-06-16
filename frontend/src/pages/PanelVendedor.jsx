// frontend/src/pages/PanelVendedor.jsx
import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API       = "http://127.0.0.1:8000";
const COLORES   = ["#e94560", "#1a1a2e", "#f0a500", "#28a745", "#17a2b8"];
const SECCIONES = ["perfil", "catalogo", "pedidos", "tableros", "estadisticas"];
const MESES     = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function PanelVendedor() {
  const vendedorId = localStorage.getItem("userId");
  const [seccion,       setSeccion]       = useState("perfil");
  const [productos,     setProductos]     = useState([]);
  const [mensaje,       setMensaje]       = useState("");
  const [form, setForm] = useState({ nombre: "", precio: "", descripcion: "", variantes: [] });
  const [nuevaVariante, setNuevaVariante] = useState({ tipo: "", valor: "" });

  const cargarProductos = async () => {
    const res = await fetch(`${API}/productos/vendedor/${vendedorId}`);
    setProductos(await res.json());
  };

  useEffect(() => { if (vendedorId) cargarProductos(); }, [vendedorId]);

  const agregarVariante = () => {
    if (!nuevaVariante.tipo || !nuevaVariante.valor) return;
    setForm({ ...form, variantes: [...form.variantes, { ...nuevaVariante }] });
    setNuevaVariante({ tipo: "", valor: "" });
  };

  const crearProducto = async () => {
    if (!form.nombre || !form.precio) { setMensaje("Nombre y precio son obligatorios."); return; }
    const res  = await fetch(`${API}/productos/vendedor/${vendedorId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: form.nombre, precio: parseFloat(form.precio), descripcion: form.descripcion, variantes: form.variantes }),
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
    const res  = await fetch(`${API}/productos/${id}`, {
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

      <div style={styles.tabs}>
        {SECCIONES.map((s) => (
          <button key={s} style={seccion === s ? styles.tabActivo : styles.tab} onClick={() => setSeccion(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}

      {seccion === "perfil" && <SeccionPerfil vendedorId={vendedorId} />}

      {seccion === "catalogo" && (
        <div>
          <h2 style={styles.subtitulo}>Mis productos</h2>
          <div style={styles.card}>
            <h3 style={styles.cardTitulo}>Agregar producto</h3>
            <input style={styles.input} placeholder="Nombre del producto" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <input style={styles.input} placeholder="Precio" type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
            <textarea style={styles.textarea} placeholder="Descripción (opcional)" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            <div style={styles.variantesRow}>
              <input style={styles.inputSmall} placeholder="Tipo (ej: Talle)" value={nuevaVariante.tipo} onChange={(e) => setNuevaVariante({ ...nuevaVariante, tipo: e.target.value })} />
              <input style={styles.inputSmall} placeholder="Valor (ej: M)" value={nuevaVariante.valor} onChange={(e) => setNuevaVariante({ ...nuevaVariante, valor: e.target.value })} />
              <button style={styles.btnSecundario} onClick={agregarVariante}>+ Variante</button>
            </div>
            {form.variantes.length > 0 && (
              <div style={styles.variantesList}>
                {form.variantes.map((v, i) => <span key={i} style={styles.varianteBadge}>{v.tipo}: {v.valor}</span>)}
              </div>
            )}
            <button style={styles.btnPrimario} onClick={crearProducto}>Crear producto</button>
          </div>

          <div style={styles.listaProductos}>
            {productos.length === 0 && <p style={styles.vacio}>No tenés productos aún.</p>}
            {productos.map((p) => (
              <div key={p.id} style={styles.productoCard}>
                <div style={styles.productoInfo}>
                  <strong>{p.nombre}</strong>
                  <span style={styles.precio}>${p.precio}</span>
                  {p.descripcion && <span style={styles.desc}>{p.descripcion}</span>}
                  <span style={estadoColor(p.estado)}>{p.estado.toUpperCase()}</span>
                  {p.variantes.length > 0 && (
                    <div style={styles.variantesList}>
                      {p.variantes.map((v, i) => <span key={i} style={styles.varianteBadge}>{v.tipo}: {v.valor}</span>)}
                    </div>
                  )}
                  <GestorImagenes productoId={p.id} imagenes={p.imagenes} onActualizar={cargarProductos} />
                </div>
                <div style={styles.productoAcciones}>
                  <select style={styles.select} value={p.estado} onChange={(e) => cambiarEstadoProducto(p.id, e.target.value)}>
                    <option value="visible">Visible</option>
                    <option value="sin_stock">Sin stock</option>
                    <option value="oculto">Oculto</option>
                  </select>
                  <button style={styles.btnEliminar} onClick={() => eliminarProducto(p.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {seccion === "pedidos"      && <SeccionPedidos vendedorId={vendedorId} />}
      {seccion === "tableros"     && <SeccionTableros vendedorId={vendedorId} />}
      {seccion === "estadisticas" && <SeccionEstadisticas vendedorId={vendedorId} />}
    </div>
  );
}

// ─── Sección Perfil ───────────────────────────────────────────────────
function SeccionPerfil({ vendedorId }) {
  const [perfil,   setPerfil]   = useState(null);
  const [form,     setForm]     = useState({ nombre_negocio: "", descripcion: "", whatsapp: "" });
  const [mensaje,  setMensaje]  = useState("");
  const [editando, setEditando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const res  = await fetch(`${API}/auth/perfil/${vendedorId}`);
      const data = await res.json();
      setPerfil(data);
      setForm({ nombre_negocio: data.nombre_negocio || "", descripcion: data.descripcion || "", whatsapp: data.whatsapp || "" });
    };
    cargar();
  }, [vendedorId]);

  const guardar = async () => {
    const res  = await fetch(`${API}/auth/perfil/${vendedorId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setMensaje(data.mensaje || data.detail);
    setEditando(false);
    setPerfil({ ...perfil, ...form });
  };

  if (!perfil) return <p style={styles.vacio}>Cargando perfil...</p>;

  return (
    <div>
      <h2 style={styles.subtitulo}>Mi perfil</h2>
      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}
      <div style={styles.card}>
        {!editando ? (
          <>
            <div style={styles.perfilRow}>
              <span style={styles.perfilLabel}>Nombre del negocio</span>
              <span style={styles.perfilValor}>{perfil.nombre_negocio || "Sin nombre"}</span>
            </div>
            <div style={styles.perfilRow}>
              <span style={styles.perfilLabel}>Descripción</span>
              <span style={styles.perfilValor}>{perfil.descripcion || "Sin descripción"}</span>
            </div>
            <div style={styles.perfilRow}>
              <span style={styles.perfilLabel}>WhatsApp</span>
              <span style={styles.perfilValor}>{perfil.whatsapp || "Sin número"}</span>
            </div>
            <div style={styles.perfilRow}>
              <span style={styles.perfilLabel}>Código de catálogo</span>
              <span style={{ ...styles.perfilValor, fontWeight: "bold", color: "#e94560" }}>{perfil.codigo_catalogo}</span>
            </div>
            <button style={styles.btnPrimario} onClick={() => setEditando(true)}>Editar perfil</button>
          </>
        ) : (
          <>
            <label style={styles.perfilLabel}>Nombre del negocio</label>
            <input style={styles.input} value={form.nombre_negocio} onChange={(e) => setForm({ ...form, nombre_negocio: e.target.value })} />
            <label style={styles.perfilLabel}>Descripción del negocio</label>
            <textarea style={styles.textarea} placeholder="Contale a tus clientes de qué trata tu tienda..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            <label style={styles.perfilLabel}>WhatsApp (con código de país)</label>
            <input style={styles.input} placeholder="ej: 5491112345678" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <div style={styles.variantesRow}>
              <button style={styles.btnPrimario}   onClick={guardar}>Guardar cambios</button>
              <button style={styles.btnSecundario} onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Gestor de imágenes ───────────────────────────────────────────────
function GestorImagenes({ productoId, imagenes, onActualizar }) {
  const inputRef = useRef();
  const LIMITE   = 5;
  const [subiendo, setSubiendo] = useState(false);

  const subirImagen = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    setSubiendo(true);
    const formData = new FormData();
    formData.append("archivo", archivo);
    const res  = await fetch(`${API}/imagenes/producto/${productoId}`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) alert(data.detail);
    setSubiendo(false);
    onActualizar();
  };

  const eliminarImagen = async (imagenId) => {
    if (!confirm("¿Eliminar esta imagen?")) return;
    await fetch(`${API}/imagenes/${imagenId}`, { method: "DELETE" });
    onActualizar();
  };

  return (
    <div style={styles.gestorImagenes}>
      <div style={styles.imagenesRow}>
        {imagenes.sort((a, b) => a.orden - b.orden).map((img) => (
          <div key={img.id} style={styles.imagenThumb}>
            <img src={img.url} alt="" style={styles.imgThumb} />
            <button style={styles.btnEliminarImg} onClick={() => eliminarImagen(img.id)}>✕</button>
          </div>
        ))}
        {imagenes.length < LIMITE && (
          <button style={styles.btnAgregarImg} onClick={() => inputRef.current.click()} disabled={subiendo}>
            {subiendo ? "..." : "+ Foto"}
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={subirImagen} />
    </div>
  );
}

// ─── Sección Pedidos ──────────────────────────────────────────────────
function SeccionPedidos({ vendedorId }) {
  const [pedidos,   setPedidos]   = useState([]);
  const [mensaje,   setMensaje]   = useState("");
  const [formNuevo, setFormNuevo] = useState({ detalle: "", total: "" });
  const [creando,   setCreando]   = useState(false);
  const [pedidoDesc, setPedidoDesc] = useState({});

  const cargar = async () => {
    const res = await fetch(`${API}/pedidos/vendedor/${vendedorId}`);
    setPedidos(await res.json());
  };
  useEffect(() => { cargar(); }, []);

  const crearPedido = async () => {
    if (!formNuevo.total) { setMensaje("El total es obligatorio."); return; }
    const res  = await fetch(`${API}/pedidos/vendedor/${vendedorId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ detalle: formNuevo.detalle, total: parseFloat(formNuevo.total), usuario_id: vendedorId }),
    });
    const data = await res.json();
    setMensaje(`Pedido creado. Código para el cliente: ${data.codigo_seguimiento}`);
    setFormNuevo({ detalle: "", total: "" });
    setCreando(false);
    cargar();
  };

  const marcarEnviado = async (id) => {
    const desc = pedidoDesc[id] || "";
    const res  = await fetch(`${API}/pedidos/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado_pedido: "enviado", descripcion: desc }),
    });
    const data = await res.json();
    setMensaje(data.mensaje || data.detail);
    cargar();
  };

  const colorEstado = (estado) => ({
    armando_pedido: { bg: "#fff3cd", color: "#856404" },
    enviado:        { bg: "#d4edda", color: "#155724" },
  }[estado] || { bg: "#f8f9fa", color: "#333" });

  const labelEstado = (estado) => estado === "armando_pedido" ? "Armando pedido" : "Enviado";

  return (
    <div>
      <h2 style={styles.subtitulo}>Mis pedidos</h2>
      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}

      {!creando ? (
        <button style={{ ...styles.btnPrimario, marginBottom: "1rem" }} onClick={() => setCreando(true)}>
          + Registrar pedido
        </button>
      ) : (
        <div style={styles.card}>
          <h3 style={styles.cardTitulo}>Nuevo pedido</h3>
          <input
            style={styles.input}
            placeholder="Detalle del pedido (opcional)"
            value={formNuevo.detalle}
            onChange={(e) => setFormNuevo({ ...formNuevo, detalle: e.target.value })}
          />
          <input
            style={styles.input}
            placeholder="Total ($)"
            type="number"
            value={formNuevo.total}
            onChange={(e) => setFormNuevo({ ...formNuevo, total: e.target.value })}
          />
          <div style={styles.variantesRow}>
            <button style={styles.btnPrimario}   onClick={crearPedido}>Crear pedido</button>
            <button style={styles.btnSecundario} onClick={() => setCreando(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {pedidos.length === 0 && <p style={styles.vacio}>No tenés pedidos activos.</p>}
      {pedidos.map((p) => {
        const c = colorEstado(p.estado_pedido);
        return (
          <div key={p.id} style={styles.productoCard}>
            <div style={styles.productoInfo}>
              <strong>Código: {p.codigo_seguimiento}</strong>
              <span style={{ ...styles.estadoBadge, backgroundColor: c.bg, color: c.color }}>
                {labelEstado(p.estado_pedido)}
              </span>
              <span style={styles.precio}>Total: ${p.total}</span>
              {p.detalle && <span style={styles.desc}>Detalle: {p.detalle}</span>}
              <span style={styles.desc}>Vence en {p.dias_restantes} día(s)</span>
              {p.descripcion && <span style={styles.desc}>📦 {p.descripcion}</span>}

              {p.estado_pedido === "armando_pedido" && (
                <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <input
                    style={styles.input}
                    placeholder="Código logístico o descripción de envío (opcional)"
                    value={pedidoDesc[p.id] || ""}
                    onChange={(e) => setPedidoDesc({ ...pedidoDesc, [p.id]: e.target.value })}
                  />
                  <button style={styles.btnEnviado} onClick={() => marcarEnviado(p.id)}>
                    Marcar como enviado
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sección Tableros Kanban ──────────────────────────────────────────
function SeccionTableros({ vendedorId }) {
  const [tableros,    setTableros]    = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [mensaje,     setMensaje]     = useState("");

  const cargar = async () => {
    const res = await fetch(`${API}/tableros/vendedor/${vendedorId}`);
    setTableros(await res.json());
  };
  useEffect(() => { cargar(); }, []);

  const crearTablero = async () => {
    if (!nuevoNombre.trim()) return;
    const res  = await fetch(`${API}/tableros/vendedor/${vendedorId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nuevoNombre }),
    });
    const data = await res.json();
    setMensaje(data.mensaje || data.detail);
    setNuevoNombre("");
    cargar();
  };

  const eliminarTablero = async (id) => {
    if (!confirm("¿Eliminar este tablero?")) return;
    await fetch(`${API}/tableros/${id}`, { method: "DELETE" });
    cargar();
  };

  const crearTarea = async (tableroId, contenido, seccion) => {
    await fetch(`${API}/tableros/${tableroId}/tareas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido, seccion }),
    });
    cargar();
  };

  const moverTarea = async (tareaId, nuevaSeccion) => {
    await fetch(`${API}/tableros/tareas/${tareaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seccion: nuevaSeccion }),
    });
    cargar();
  };

  const eliminarTarea = async (tareaId) => {
    await fetch(`${API}/tableros/tareas/${tareaId}`, { method: "DELETE" });
    cargar();
  };

  const COLUMNAS = ["por_hacer", "en_progreso", "hecho"];
  const LABELS   = { por_hacer: "Por hacer", en_progreso: "En progreso", hecho: "Hecho" };

  return (
    <div>
      <h2 style={styles.subtitulo}>Tableros Kanban</h2>
      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}

      <div style={styles.variantesRow}>
        <input style={styles.inputSmall} placeholder="Nombre del tablero" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
        <button style={styles.btnSecundario} onClick={crearTablero}>+ Crear tablero</button>
      </div>

      {tableros.length === 0 && <p style={styles.vacio}>No tenés tableros aún.</p>}

      {tableros.map((t) => (
        <div key={t.id} style={styles.tableroCard}>
          <div style={styles.tableroHeader}>
            <strong>{t.nombre}</strong>
            <button style={styles.btnEliminarSmall} onClick={() => eliminarTablero(t.id)}>✕</button>
          </div>
          <div style={styles.kanbanGrid}>
            {COLUMNAS.map((col) => (
              <div key={col} style={styles.kanbanCol}>
                <div style={styles.kanbanColHeader}>{LABELS[col]}</div>
                {t.tareas.filter((ta) => ta.seccion === col).map((ta) => (
                  <div key={ta.id} style={styles.kanbanTarea}>
                    <span>{ta.contenido}</span>
                    <div style={styles.kanbanAcciones}>
                      {col !== "por_hacer" && <button style={styles.btnKanban} onClick={() => moverTarea(ta.id, COLUMNAS[COLUMNAS.indexOf(col) - 1])}>←</button>}
                      {col !== "hecho"     && <button style={styles.btnKanban} onClick={() => moverTarea(ta.id, COLUMNAS[COLUMNAS.indexOf(col) + 1])}>→</button>}
                      <button style={styles.btnKanbanElim} onClick={() => eliminarTarea(ta.id)}>✕</button>
                    </div>
                  </div>
                ))}
                <button style={styles.btnAgregarTarea} onClick={() => {
                  const contenido = prompt("Nueva tarea:");
                  if (contenido) crearTarea(t.id, contenido, col);
                }}>+ Tarea</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sección Estadísticas ─────────────────────────────────────────────
function SeccionEstadisticas({ vendedorId }) {
  const [stats,   setStats]   = useState(null);
  const [mensaje, setMensaje] = useState("");

  const cargar = async () => {
    const res = await fetch(`${API}/estadisticas/vendedor/${vendedorId}`);
    setStats(await res.json());
  };

  useEffect(() => { cargar(); }, []);

  const reiniciar = async () => {
    if (!confirm("¿Reiniciar todas las estadísticas? Esta acción no se puede deshacer.")) return;
    const res  = await fetch(`${API}/estadisticas/vendedor/${vendedorId}/reiniciar`, { method: "DELETE" });
    const data = await res.json();
    setMensaje(data.mensaje);
    cargar();
  };

  if (!stats) return <p style={styles.vacio}>Cargando estadísticas...</p>;

  const totalGeneral  = stats.resumen.reduce((acc, r) => acc + r.total_ganancia, 0);
  const pedidosTotal  = stats.resumen.reduce((acc, r) => acc + r.total_pedidos,  0);

  // Datos para el gráfico: últimos 12 meses
  const datosMeses = stats.resumen.flatMap((r) =>
    r.meses.map((m) => ({
      nombre:   `${MESES[m.mes - 1]} ${r.anio}`,
      ganancia: m.total_ganancia,
      pedidos:  m.total_pedidos,
    }))
  ).slice(0, 12).reverse();

  return (
    <div>
      <h2 style={styles.subtitulo}>Mis estadísticas</h2>
      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <span style={styles.statNum}>${totalGeneral.toFixed(2)}</span>
          <span style={styles.statLabel}>Total ganado</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statNum}>{pedidosTotal}</span>
          <span style={styles.statLabel}>Pedidos enviados</span>
        </div>
      </div>

      {stats.resumen.length === 0 ? (
        <p style={styles.vacio}>Aún no tenés estadísticas registradas.</p>
      ) : (
        <>
          {/* Gráfico mensual */}
          <h3 style={{ color: "#1a1a2e", marginTop: "2rem" }}>Ganancia mensual</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={datosMeses} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <XAxis dataKey="nombre" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
              <Bar dataKey="ganancia" name="Ganancia">
                {datosMeses.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Historial por año */}
          <h3 style={{ color: "#1a1a2e", marginTop: "2rem" }}>Historial anual</h3>
          {stats.resumen.map((r) => (
            <div key={r.anio} style={styles.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "#1a1a2e", fontSize: "1.1rem" }}>{r.anio}</strong>
                <span style={styles.precio}>${r.total_ganancia.toFixed(2)} — {r.total_pedidos} pedidos</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                {r.meses.map((m) => (
                  <div key={m.mes} style={styles.mesBadge}>
                    <span style={styles.mesNombre}>{MESES[m.mes - 1]}</span>
                    <span style={styles.mesValor}>${m.total_ganancia.toFixed(2)}</span>
                    <span style={styles.mesPedidos}>{m.total_pedidos} pedidos</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button style={styles.btnReiniciar} onClick={reiniciar}>
            Reiniciar estadísticas
          </button>
        </>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────
const estadoColor = (estado) => ({
  ...styles.estadoBadge,
  backgroundColor: estado === "visible" ? "#d4edda" : estado === "sin_stock" ? "#fff3cd" : "#f8d7da",
  color:           estado === "visible" ? "#155724" : estado === "sin_stock" ? "#856404" : "#721c24",
});

const styles = {
  container:        { maxWidth: "960px", margin: "2rem auto", padding: "0 1rem" },
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
  btnEnviado:       { backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.9rem" },
  btnReiniciar:     { backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem 1.5rem", cursor: "pointer", fontSize: "0.9rem", marginTop: "1rem" },
  listaProductos:   { display: "flex", flexDirection: "column", gap: "1rem" },
  productoCard:     { backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" },
  productoInfo:     { display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1 },
  precio:           { color: "#e94560", fontWeight: "bold" },
  desc:             { color: "#666", fontSize: "0.9rem" },
  estadoBadge:      { display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", width: "fit-content" },
  productoAcciones: { display: "flex", gap: "0.5rem", flexDirection: "column" },
  select:           { padding: "0.5rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.9rem" },
  vacio:            { color: "#666", textAlign: "center", padding: "2rem" },
  gestorImagenes:   { marginTop: "0.5rem" },
  imagenesRow:      { display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" },
  imagenThumb:      { position: "relative", width: "64px", height: "64px" },
  imgThumb:         { width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px" },
  btnEliminarImg:   { position: "absolute", top: "-6px", right: "-6px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  btnAgregarImg:    { width: "64px", height: "64px", border: "2px dashed #ddd", borderRadius: "8px", background: "transparent", cursor: "pointer", color: "#999", fontSize: "0.8rem" },
  tableroCard:      { backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "1.5rem" },
  tableroHeader:    { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" },
  btnEliminarSmall: { background: "#dc3545", color: "#fff", border: "none", borderRadius: "6px", padding: "0.2rem 0.6rem", cursor: "pointer" },
  kanbanGrid:       { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" },
  kanbanCol:        { backgroundColor: "#f0f0f0", borderRadius: "8px", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  kanbanColHeader:  { fontWeight: "bold", fontSize: "0.85rem", color: "#1a1a2e", marginBottom: "0.25rem" },
  kanbanTarea:      { backgroundColor: "#fff", borderRadius: "6px", padding: "0.5rem", fontSize: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  kanbanAcciones:   { display: "flex", gap: "0.2rem" },
  btnKanban:        { background: "#1a1a2e", color: "#fff", border: "none", borderRadius: "4px", padding: "0.15rem 0.4rem", cursor: "pointer", fontSize: "0.75rem" },
  btnKanbanElim:    { background: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", padding: "0.15rem 0.4rem", cursor: "pointer", fontSize: "0.75rem" },
  btnAgregarTarea:  { background: "transparent", border: "1px dashed #ccc", borderRadius: "6px", padding: "0.4rem", cursor: "pointer", color: "#999", fontSize: "0.8rem" },
  statsRow:         { display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" },
  statCard:         { backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "1.5rem 2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
  statNum:          { fontSize: "2rem", fontWeight: "bold", color: "#e94560" },
  statLabel:        { color: "#666", fontSize: "0.9rem" },
  perfilRow:        { display: "flex", flexDirection: "column", gap: "0.2rem", padding: "0.5rem 0", borderBottom: "1px solid #eee" },
  perfilLabel:      { fontSize: "0.8rem", color: "#999", fontWeight: "bold", textTransform: "uppercase" },
  perfilValor:      { fontSize: "1rem", color: "#1a1a2e" },
  mesBadge:         { backgroundColor: "#fff", borderRadius: "8px", padding: "0.5rem 0.75rem", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", minWidth: "70px" },
  mesNombre:        { fontSize: "0.75rem", color: "#999", fontWeight: "bold" },
  mesValor:         { fontSize: "0.9rem", color: "#e94560", fontWeight: "bold" },
  mesPedidos:       { fontSize: "0.75rem", color: "#666" },
};

export default PanelVendedor;