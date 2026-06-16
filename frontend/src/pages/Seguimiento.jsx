// frontend/src/pages/Seguimiento.jsx
// Vista pública: consulta el estado de un pedido por código
import { useState } from "react";
import { useParams, Link } from "react-router-dom";

const API = "http://127.0.0.1:8000";

const ESTADO_INFO = {
  pendiente:  { label: "Pendiente",   color: "#856404", bg: "#fff3cd", emoji: "⏳" },
  en_proceso: { label: "En proceso",  color: "#004085", bg: "#cce5ff", emoji: "🔧" },
  enviado:    { label: "Enviado",     color: "#155724", bg: "#d4edda", emoji: "🚚" },
  entregado:  { label: "Entregado",   color: "#383d41", bg: "#e2e3e5", emoji: "✅" },
};

function Seguimiento() {
  const { codigo: codigoParam } = useParams();
  const [codigo,  setCodigo]  = useState(codigoParam || "");
  const [pedido,  setPedido]  = useState(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const consultar = async () => {
    if (!codigo.trim()) return;
    setError("");
    setPedido(null);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/pedidos/seguimiento/${codigo.trim().toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) { setError(data.detail); return; }
      setPedido(data);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const info = pedido ? ESTADO_INFO[pedido.estado_pedido] : null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.titulo}>Seguimiento de pedido</h2>
        <p style={styles.subtitulo}>Ingresá tu código de 8 caracteres</p>

        <input
          style={styles.input}
          type="text"
          placeholder="Ej: GELFJGU4"
          maxLength={8}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        />

        <button
          style={loading ? styles.btnDesactivado : styles.btn}
          onClick={consultar}
          disabled={loading}
        >
          {loading ? "Consultando..." : "Consultar pedido"}
        </button>

        {error && <p style={styles.error}>{error}</p>}

        {pedido && info && (
          <div style={{ ...styles.resultado, backgroundColor: info.bg }}>
            <div style={styles.emoji}>{info.emoji}</div>
            <h3 style={{ color: info.color, margin: 0 }}>{info.label}</h3>
            <p style={styles.total}>Total: ${pedido.total}</p>
            <p style={styles.dias}>Código válido por {pedido.dias_restantes} día(s) más</p>
          </div>
        )}

        <Link to="/" style={styles.link}>← Volver al inicio</Link>
      </div>
    </div>
  );
}

const styles = {
  container:     { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "1rem" },
  card:          { backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "2.5rem", width: "100%", maxWidth: "420px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: "1rem" },
  titulo:        { fontSize: "1.8rem", color: "#1a1a2e", margin: 0, textAlign: "center" },
  subtitulo:     { color: "#666", textAlign: "center", margin: 0, fontSize: "0.95rem" },
  input:         { padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1.1rem", textAlign: "center", letterSpacing: "0.2rem", boxSizing: "border-box" },
  btn:           { backgroundColor: "#e94560", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem", fontSize: "1rem", cursor: "pointer" },
  btnDesactivado:{ backgroundColor: "#ccc", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem", fontSize: "1rem", cursor: "not-allowed" },
  error:         { color: "#e94560", textAlign: "center", fontSize: "0.9rem", margin: 0 },
  resultado:     { borderRadius: "12px", padding: "1.5rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" },
  emoji:         { fontSize: "2.5rem" },
  total:         { margin: 0, color: "#333", fontWeight: "bold" },
  dias:          { margin: 0, color: "#666", fontSize: "0.85rem" },
  link:          { color: "#666", textDecoration: "none", textAlign: "center", fontSize: "0.9rem" },
};

export default Seguimiento;
