import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";
const SECCIONES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "vendedores", label: "Vendedores" },
];

function PanelAdmin() {
  const [seccion,       setSeccion]       = useState("dashboard");
  const [vendedores,   setVendedores]   = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [mensaje,      setMensaje]      = useState("");

  const cargarDatos = async () => {
    const [resV, resS] = await Promise.all([
      fetch(`${API}/admin/vendedores`),
      fetch(`${API}/admin/estadisticas`),
    ]);
    setVendedores(await resV.json());
    setEstadisticas(await resS.json());
  };

  useEffect(() => { cargarDatos(); }, []);

  const aprobar = async (id) => {
    const res  = await fetch(`${API}/admin/vendedores/${id}/aprobar`, { method: "PATCH" });
    const data = await res.json();
    setMensaje(data.mensaje || data.detail);
    cargarDatos();
  };

  const deshabilitar = async (id) => {
    const res  = await fetch(`${API}/admin/vendedores/${id}/deshabilitar`, { method: "PATCH" });
    const data = await res.json();
    setMensaje(data.mensaje || data.detail);
    cargarDatos();
  };

  const ajustarLimite = async (id, limite) => {
    const res  = await fetch(`${API}/admin/vendedores/${id}/limite-tableros?limite=${limite}`, { method: "PATCH" });
    const data = await res.json();
    setMensaje(data.mensaje || data.detail);
    cargarDatos();
  };

  const totalVendedores = estadisticas?.total_vendedores ?? 0;
  const vendedoresActivos = estadisticas?.vendedores_activos ?? 0;
  const vendedoresPendientes = estadisticas?.vendedores_pendientes ?? 0;

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
                <h1 className="section-title" style={{ fontSize: "2rem" }}>Panel de administrador</h1>
                <p className="section-subtitle">Gestioná vendedores y revisá métricas generales de la plataforma.</p>
              </div>
            </div>

            {mensaje && <p className="msg-success" style={{ marginBottom: "1rem" }}>{mensaje}</p>}

            {seccion === "dashboard" && (
              <>
                <div className="stats-grid">
                  <div className="card admin-card text-center">
                    <div className="stat-number">{totalVendedores}</div>
                    <div className="stat-label">Total vendedores</div>
                  </div>
                  <div className="card admin-card text-center">
                    <div className="stat-number">{vendedoresActivos}</div>
                    <div className="stat-label">Activos</div>
                  </div>
                  <div className="card admin-card text-center">
                    <div className="stat-number">{vendedoresPendientes}</div>
                    <div className="stat-label">Pendientes</div>
                  </div>
                </div>

                <h2 className="section-title mt-lg" style={{ fontSize: "1.4rem" }}>Vendedores</h2>
                <div className="list-grid mt-lg">
                  {vendedores.map((v) => (
                    <article key={v.id} className="card admin-card">
                      <div className="card-header">
                        <div>
                          <h3 style={{ fontSize: "1.05rem", marginBottom: "0.35rem" }}>{v.nombre_negocio || "Sin nombre"}</h3>
                          <p className="text-muted">{v.email}</p>
                        </div>
                        <span className={`badge ${v.estado === "activo" ? "badge-success" : v.estado === "pendiente" ? "badge-warning" : "badge-danger"}`}>
                          {v.estado.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-row text-muted">
                        {v.codigo_catalogo && <span className="badge badge-info">Código: {v.codigo_catalogo}</span>}
                        <span className="badge badge-info">Tableros: {v.limite_tableros}</span>
                      </div>

                      <div className="flex-row" style={{ justifyContent: "flex-end" }}>
                        {v.estado === "pendiente" && (
                          <button className="btn-primary" onClick={() => aprobar(v.id)}>Aprobar</button>
                        )}
                        {v.estado === "activo" && (
                          <button className="btn-danger" onClick={() => deshabilitar(v.id)}>Deshabilitar</button>
                        )}
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            const nuevo = prompt("Nuevo límite de tableros:", v.limite_tableros);
                            if (nuevo && !Number.isNaN(Number(nuevo))) ajustarLimite(v.id, Number.parseInt(nuevo, 10));
                          }}
                        >
                          Ajustar tableros
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}

            {seccion === "vendedores" && (
              <div className="list-grid">
                {vendedores.map((v) => (
                  <article key={v.id} className="card admin-card">
                    <div className="split-row">
                      <div>
                        <h3 style={{ fontSize: "1.05rem", marginBottom: "0.35rem" }}>{v.nombre_negocio || "Sin nombre"}</h3>
                        <p className="text-muted">{v.email}</p>
                      </div>
                      <span className={`badge ${v.estado === "activo" ? "badge-success" : v.estado === "pendiente" ? "badge-warning" : "badge-danger"}`}>
                        {v.estado.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-row">
                      {v.codigo_catalogo && <span className="badge badge-info">Código: {v.codigo_catalogo}</span>}
                      <span className="badge badge-info">Tableros: {v.limite_tableros}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default PanelAdmin;
