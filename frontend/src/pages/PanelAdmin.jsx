// frontend/src/pages/PanelAdmin.jsx
import { useState, useEffect } from "react";

const API = "http://127.0.0.1:8000";

function PanelAdmin() {
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

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Panel de Administrador</h1>

      {estadisticas && (
        <div style={styles.statsRow}>
          <div style={styles.statCard}><span style={styles.statNum}>{estadisticas.total_vendedores}</span><span style={styles.statLabel}>Total vendedores</span></div>
          <div style={styles.statCard}><span style={styles.statNum}>{estadisticas.vendedores_activos}</span><span style={styles.statLabel}>Activos</span></div>
          <div style={styles.statCard}><span style={styles.statNum}>{estadisticas.vendedores_pendientes}</span><span style={styles.statLabel}>Pendientes</span></div>
        </div>
      )}

      {mensaje && <p style={styles.mensaje}>{mensaje}</p>}

      <h2 style={styles.subtitulo}>Vendedores</h2>
      <div style={styles.tabla}>
        {vendedores.map((v) => (
          <div key={v.id} style={styles.fila}>
            <div style={styles.info}>
              <strong>{v.nombre_negocio || "Sin nombre"}</strong>
              <span style={styles.email}>{v.email}</span>
              <span style={estadoColor(v.estado)}>{v.estado.toUpperCase()}</span>
              {v.codigo_catalogo && <span style={styles.codigo}>Código: {v.codigo_catalogo}</span>}
              <span style={styles.limite}>Tableros: {v.limite_tableros}</span>
            </div>
            <div style={styles.acciones}>
              {v.estado === "pendiente" && <button style={styles.btnAprobar} onClick={() => aprobar(v.id)}>Aprobar</button>}
              {v.estado === "activo"    && <button style={styles.btnDeshab}  onClick={() => deshabilitar(v.id)}>Deshabilitar</button>}
              <button style={styles.btnLimite} onClick={() => {
                const nuevo = prompt("Nuevo límite de tableros:", v.limite_tableros);
                if (nuevo && !isNaN(nuevo)) ajustarLimite(v.id, parseInt(nuevo));
              }}>Ajustar tableros</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const estadoColor = (estado) => ({
  display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", width: "fit-content",
  backgroundColor: estado === "activo" ? "#d4edda" : estado === "pendiente" ? "#fff3cd" : "#f8d7da",
  color:           estado === "activo" ? "#155724" : estado === "pendiente" ? "#856404" : "#721c24",
});

const styles = {
  container:  { maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" },
  titulo:     { color: "#1a1a2e", fontSize: "1.8rem", marginBottom: "1.5rem" },
  subtitulo:  { color: "#1a1a2e", fontSize: "1.3rem", margin: "1.5rem 0 1rem" },
  statsRow:   { display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" },
  statCard:   { backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "1.5rem 2rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
  statNum:    { fontSize: "2rem", fontWeight: "bold", color: "#e94560" },
  statLabel:  { color: "#666", fontSize: "0.9rem" },
  mensaje:    { backgroundColor: "#d4edda", color: "#155724", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" },
  tabla:      { display: "flex", flexDirection: "column", gap: "1rem" },
  fila:       { backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" },
  info:       { display: "flex", flexDirection: "column", gap: "0.25rem" },
  email:      { color: "#666", fontSize: "0.9rem" },
  codigo:     { color: "#1a1a2e", fontSize: "0.85rem", fontWeight: "bold" },
  limite:     { color: "#666", fontSize: "0.85rem" },
  acciones:   { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  btnAprobar: { backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.9rem" },
  btnDeshab:  { backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.9rem" },
  btnLimite:  { backgroundColor: "#1a1a2e", color: "#fff", border: "none", borderRadius: "8px", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.9rem" },
};

export default PanelAdmin;
