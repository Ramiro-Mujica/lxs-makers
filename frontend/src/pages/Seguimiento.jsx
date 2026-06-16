// frontend/src/pages/Seguimiento.jsx
// Vista pública: consulta el estado de un pedido por código
import { useState } from "react";
import { useParams, Link } from "react-router-dom";

const API = "http://127.0.0.1:8000";

const ESTADO_INFO = {
  pendiente:  { label: "Pendiente",  badge: "badge-warning", emoji: "⏳" },
  en_proceso: { label: "En proceso", badge: "badge-info", emoji: "🔧" },
  enviado:    { label: "Enviado",    badge: "badge-success", emoji: "🚚" },
  entregado:  { label: "Entregado",  badge: "badge-success", emoji: "✅" },
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
    <div className="tracking-page page-shell">
      <div className="center-page">
        <div className="card tracking-card" style={{ width: "100%", maxWidth: "460px" }}>
          <div className="text-center">
            <h2 className="section-title" style={{ fontSize: "1.75rem" }}>Seguimiento de pedido</h2>
            <p className="section-subtitle">Ingresá tu código de 8 caracteres</p>
          </div>

          <input className="input" type="text" placeholder="Ej: GELFJGU4" maxLength={8} value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />

          <button className="btn-primary" onClick={consultar} disabled={loading}>
            {loading ? "Consultando..." : "Consultar pedido"}
          </button>

          {error && <p className="msg-error">{error}</p>}

          {pedido && info && (
            <div className="card" style={{ padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.35rem" }}>{info.emoji}</div>
              <span className={`badge ${info.badge}`}>{info.label}</span>
              <p className="highlight-number" style={{ fontSize: "1.4rem", marginTop: "0.75rem" }}>Total: ${pedido.total}</p>
              <p className="text-muted">Código válido por {pedido.dias_restantes} día(s) más</p>
            </div>
          )}

          <Link to="/" className="link-muted text-center">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}

export default Seguimiento;
