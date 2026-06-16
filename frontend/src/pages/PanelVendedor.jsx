// frontend/src/pages/PanelVendedor.jsx
import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const API       = "http://127.0.0.1:8000";
const COLORES   = ["#7c3aed", "#a78bfa", "#10b981", "#f59e0b", "#ef4444"];
const SECCIONES = [
  { id: "perfil",       label: "Perfil" },
  { id: "catalogo",     label: "Catálogo" },
  { id: "pedidos",      label: "Pedidos" },
  { id: "tableros",     label: "Tableros" },
  { id: "estadisticas", label: "Estadísticas" },
];
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

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
    <div className="dashboard-page page-shell">
      <div className="sidebar-layout">
        <aside className="sidebar">
          <div className="sidebar__brand">LXS Makers</div>
          <div className="sidebar__section">
            {SECCIONES.map((item) => (
              <button
                key={item.id}
                className={`sidebar__item ${seccion === item.id ? "is-active" : ""}`.trim()}
                onClick={() => setSeccion(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="dashboard-content">
          <div className="page-container" style={{ width: "100%" }}>
            <div className="split-row" style={{ marginBottom: "1.25rem" }}>
              <div>
                <h1 className="section-title" style={{ fontSize: "2rem" }}>Panel del vendedor</h1>
                <p className="section-subtitle">Gestioná tu perfil, catálogo, pedidos, tableros y estadísticas desde un mismo lugar.</p>
              </div>
            </div>

            {mensaje && <p className="msg-success" style={{ marginBottom: "1rem" }}>{mensaje}</p>}

            {seccion === "perfil" && <SeccionPerfil vendedorId={vendedorId} />}

            {seccion === "catalogo" && (
              <div className="kanban-board">
                <section className="card dashboard-card">
                  <h2 className="section-title" style={{ fontSize: "1.4rem" }}>Agregar producto</h2>
                  <div className="list-grid mt-lg">
                    <input className="input" placeholder="Nombre del producto" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
                    <input className="input" placeholder="Precio" type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
                    <textarea className="input" placeholder="Descripción (opcional)" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
                    <div className="flex-row">
                      <input className="input" placeholder="Tipo (ej: Talle)" value={nuevaVariante.tipo} onChange={(e) => setNuevaVariante({ ...nuevaVariante, tipo: e.target.value })} />
                      <input className="input" placeholder="Valor (ej: M)" value={nuevaVariante.valor} onChange={(e) => setNuevaVariante({ ...nuevaVariante, valor: e.target.value })} />
                      <button className="btn-secondary" onClick={agregarVariante}>+ Variante</button>
                    </div>
                    {form.variantes.length > 0 && (
                      <div className="flex-row">
                        {form.variantes.map((v, i) => (
                          <span key={i} className="badge badge-info">{v.tipo}: {v.valor}</span>
                        ))}
                      </div>
                    )}
                    <button className="btn-primary" onClick={crearProducto}>Crear producto</button>
                  </div>
                </section>

                <div className="list-grid">
                  {productos.length === 0 && <p className="text-muted text-center">No tenés productos aún.</p>}
                  {productos.map((p) => (
                    <article key={p.id} className="card seller-card">
                      <div className="split-row">
                        <div>
                          <strong style={{ fontSize: "1.05rem" }}>{p.nombre}</strong>
                          <p className="highlight-number" style={{ fontSize: "1.05rem", marginTop: "0.2rem" }}>${p.precio}</p>
                        </div>
                        <span className={`badge ${estadoBadgeClass(p.estado)}`}>{p.estado.toUpperCase()}</span>
                      </div>
                      {p.descripcion && <p className="text-muted">{p.descripcion}</p>}
                      {p.variantes.length > 0 && (
                        <div className="flex-row">
                          {p.variantes.map((v, i) => <span key={i} className="badge badge-info">{v.tipo}: {v.valor}</span>)}
                        </div>
                      )}
                      <GestorImagenes productoId={p.id} imagenes={p.imagenes} onActualizar={cargarProductos} />
                      <div className="split-row" style={{ alignItems: "center" }}>
                        <select className="select" value={p.estado} onChange={(e) => cambiarEstadoProducto(p.id, e.target.value)} style={{ maxWidth: "180px" }}>
                          <option value="visible">Visible</option>
                          <option value="sin_stock">Sin stock</option>
                          <option value="oculto">Oculto</option>
                        </select>
                        <button className="btn-danger" onClick={() => eliminarProducto(p.id)}>Eliminar</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {seccion === "pedidos"      && <SeccionPedidos vendedorId={vendedorId} />}
            {seccion === "tableros"     && <SeccionTableros vendedorId={vendedorId} />}
            {seccion === "estadisticas" && <SeccionEstadisticas vendedorId={vendedorId} />}
          </div>
        </main>
      </div>
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
    setPerfil((actual) => ({ ...actual, ...form }));
  };

  if (!perfil) return <p className="text-muted">Cargando perfil...</p>;

  return (
    <div>
      <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Mi perfil</h2>
      {mensaje && <p className="msg-success" style={{ marginBottom: "1rem" }}>{mensaje}</p>}
      <div className="card dashboard-card">
        {!editando ? (
          <>
            <div className="list-grid">
              <div>
                <p className="text-muted" style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Nombre del negocio</p>
                <p>{perfil.nombre_negocio || "Sin nombre"}</p>
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Descripción</p>
                <p>{perfil.descripcion || "Sin descripción"}</p>
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>WhatsApp</p>
                <p>{perfil.whatsapp || "Sin número"}</p>
              </div>
              <div>
                <p className="text-muted" style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Código de catálogo</p>
                <p className="highlight-number">{perfil.codigo_catalogo}</p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => setEditando(true)}>Editar perfil</button>
          </>
        ) : (
          <>
            <label className="text-muted" style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Nombre del negocio</label>
            <input className="input" value={form.nombre_negocio} onChange={(e) => setForm({ ...form, nombre_negocio: e.target.value })} />
            <label className="text-muted" style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>Descripción del negocio</label>
            <textarea className="input" placeholder="Contale a tus clientes de qué trata tu tienda..." value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            <label className="text-muted" style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>WhatsApp (con código de país)</label>
            <input className="input" placeholder="ej: 5491112345678" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            <div className="flex-row">
              <button className="btn-primary" onClick={guardar}>Guardar cambios</button>
              <button className="btn-secondary" onClick={() => setEditando(false)}>Cancelar</button>
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
    <div>
      <div className="flex-row">
        {imagenes.sort((a, b) => a.orden - b.orden).map((img) => (
          <div key={img.id} style={{ position: "relative", width: "64px", height: "64px" }}>
            <img src={img.url} alt="" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px" }} />
            <button className="btn-danger" onClick={() => eliminarImagen(img.id)} style={{ position: "absolute", top: "-6px", right: "-6px", width: "20px", height: "20px", padding: 0, borderRadius: "50%" }}>✕</button>
          </div>
        ))}
        {imagenes.length < LIMITE && (
          <button className="btn-secondary" style={{ width: "64px", height: "64px", padding: 0 }} onClick={() => inputRef.current.click()} disabled={subiendo}>
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
  const [pedidos,    setPedidos]    = useState([]);
  const [mensaje,    setMensaje]    = useState("");
  const [formNuevo,  setFormNuevo]  = useState({ detalle: "", total: "" });
  const [creando,    setCreando]    = useState(false);
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
    armando_pedido: "badge-warning",
    enviado:        "badge-success",
  }[estado] || "badge-info");

  const labelEstado = (estado) => estado === "armando_pedido" ? "Armando pedido" : "Enviado";

  return (
    <div>
      <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Mis pedidos</h2>
      {mensaje && <p className="msg-success" style={{ marginBottom: "1rem" }}>{mensaje}</p>}

      {!creando ? (
        <button className="btn-primary" style={{ marginBottom: "1rem" }} onClick={() => setCreando(true)}>
          + Registrar pedido
        </button>
      ) : (
        <div className="card dashboard-card">
          <h3 className="section-title" style={{ fontSize: "1.15rem" }}>Nuevo pedido</h3>
          <input className="input" placeholder="Detalle del pedido (opcional)" value={formNuevo.detalle} onChange={(e) => setFormNuevo({ ...formNuevo, detalle: e.target.value })} />
          <input className="input" placeholder="Total ($)" type="number" value={formNuevo.total} onChange={(e) => setFormNuevo({ ...formNuevo, total: e.target.value })} />
          <div className="flex-row">
            <button className="btn-primary"   onClick={crearPedido}>Crear pedido</button>
            <button className="btn-secondary" onClick={() => setCreando(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {pedidos.length === 0 && <p className="text-muted text-center">No tenés pedidos activos.</p>}
      {pedidos.map((p) => (
        <div key={p.id} className="card seller-card">
          <div className="list-grid">
            <strong>Código: {p.codigo_seguimiento}</strong>
            <span className={`badge ${colorEstado(p.estado_pedido)}`}>{labelEstado(p.estado_pedido)}</span>
            <span className="highlight-number">Total: ${p.total}</span>
            {p.detalle    && <span className="text-muted">Detalle: {p.detalle}</span>}
            <span className="text-muted">Vence en {p.dias_restantes} día(s)</span>
            {p.descripcion && <span className="text-muted">📦 {p.descripcion}</span>}
            {p.estado_pedido === "armando_pedido" && (
              <div className="list-grid">
                <input className="input" placeholder="Código logístico o descripción de envío (opcional)" value={pedidoDesc[p.id] || ""} onChange={(e) => setPedidoDesc({ ...pedidoDesc, [p.id]: e.target.value })} />
                <button className="btn-success" onClick={() => marcarEnviado(p.id)}>Marcar como enviado</button>
              </div>
            )}
          </div>
        </div>
      ))}
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
      <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Tableros Kanban</h2>
      {mensaje && <p className="msg-success" style={{ marginBottom: "1rem" }}>{mensaje}</p>}

      <div className="flex-row">
        <input className="input" style={{ maxWidth: "320px" }} placeholder="Nombre del tablero" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
        <button className="btn-secondary" onClick={crearTablero}>+ Crear tablero</button>
      </div>

      {tableros.length === 0 && <p className="text-muted text-center">No tenés tableros aún.</p>}

      {tableros.map((t) => (
        <div key={t.id} className="card dashboard-card" style={{ marginTop: "1rem" }}>
          <div className="split-row">
            <strong>{t.nombre}</strong>
            <button className="btn-danger" onClick={() => eliminarTablero(t.id)}>✕</button>
          </div>
          <div className="kanban-columns">
            {COLUMNAS.map((col) => (
              <div key={col} className="kanban-column">
                <div className="kanban-column__title">{LABELS[col]}</div>
                {t.tareas.filter((ta) => ta.seccion === col).map((ta) => (
                  <div key={ta.id} className="kanban-task">
                    <span>{ta.contenido}</span>
                    <div className="kanban-task__actions">
                      {col !== "por_hacer" && <button className="btn-secondary" onClick={() => moverTarea(ta.id, COLUMNAS[COLUMNAS.indexOf(col) - 1])}>←</button>}
                      {col !== "hecho"     && <button className="btn-secondary" onClick={() => moverTarea(ta.id, COLUMNAS[COLUMNAS.indexOf(col) + 1])}>→</button>}
                      <button className="btn-danger" onClick={() => eliminarTarea(ta.id)}>✕</button>
                    </div>
                  </div>
                ))}
                <button className="btn-ghost" onClick={() => {
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

  if (!stats) return <p className="text-muted text-center">Cargando estadísticas...</p>;

  const totalGeneral = stats.resumen.reduce((acc, r) => acc + r.total_ganancia, 0);
  const pedidosTotal = stats.resumen.reduce((acc, r) => acc + r.total_pedidos,  0);

  const datosMeses = stats.resumen.flatMap((r) =>
    r.meses.map((m) => ({
      nombre:   `${MESES[m.mes - 1]} ${r.anio}`,
      ganancia: m.total_ganancia,
      pedidos:  m.total_pedidos,
    }))
  ).slice(0, 12).reverse();

  return (
    <div>
      <h2 className="section-title" style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>Mis estadísticas</h2>
      {mensaje && <p className="msg-success" style={{ marginBottom: "1rem" }}>{mensaje}</p>}

      <div className="stats-grid">
        <div className="card dashboard-card text-center">
          <span className="stat-number">${totalGeneral.toFixed(2)}</span>
          <span className="stat-label">Total ganado</span>
        </div>
        <div className="card dashboard-card text-center">
          <span className="stat-number">{pedidosTotal}</span>
          <span className="stat-label">Pedidos enviados</span>
        </div>
      </div>

      {stats.resumen.length === 0 ? (
        <p className="text-muted text-center">Aún no tenés estadísticas registradas.</p>
      ) : (
        <>
          <div className="card chart-card mt-lg">
            <h3 className="section-title" style={{ fontSize: "1.15rem", marginBottom: "1rem" }}>Ganancia mensual</h3>
            <div className="chart-shell">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosMeses} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                  <XAxis dataKey="nombre" angle={-30} textAnchor="end" tick={{ fontSize: 11, fill: "#a0a0b8" }} />
                  <YAxis tick={{ fill: "#a0a0b8" }} />
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} contentStyle={{ background: "#1a1625", border: "1px solid #2d2a3d", borderRadius: 12, color: "#fff" }} />
                  <Bar dataKey="ganancia" name="Ganancia">
                    {datosMeses.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <h3 className="section-title mt-lg" style={{ fontSize: "1.15rem" }}>Historial anual</h3>
          {stats.resumen.map((r) => (
            <div key={r.anio} className="card dashboard-card" style={{ marginTop: "1rem" }}>
              <div className="split-row">
                <strong>{r.anio}</strong>
                <span className="highlight-number">${r.total_ganancia.toFixed(2)} — {r.total_pedidos} pedidos</span>
              </div>
              <div className="flex-row">
                {r.meses.map((m) => (
                  <div key={m.mes} className="card" style={{ padding: "0.75rem", minWidth: "92px", textAlign: "center" }}>
                    <span className="text-muted" style={{ fontSize: "0.75rem", fontWeight: 700 }}>{MESES[m.mes - 1]}</span>
                    <div className="highlight-number" style={{ fontSize: "0.95rem", marginTop: "0.25rem" }}>${m.total_ganancia.toFixed(2)}</div>
                    <div className="text-muted" style={{ fontSize: "0.75rem" }}>{m.total_pedidos} pedidos</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button className="btn-danger mt-lg" onClick={reiniciar}>
            Reiniciar estadísticas
          </button>
        </>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────
const estadoBadgeClass = (estado) => ({
  visible:   "badge-success",
  sin_stock: "badge-warning",
  oculto:    "badge-danger",
}[estado] || "badge-info");

export default PanelVendedor;