// frontend/src/pages/Pendiente.jsx
import { Link } from "react-router-dom";

function Pendiente() {
  return (
    <div className="auth-page page-shell">
      <div className="center-page">
        <div className="card auth-card" style={{ width: "100%", maxWidth: "480px", textAlign: "center" }}>
          <div className="stat-number" style={{ lineHeight: 1 }}>⏳</div>
          <h2 className="section-title" style={{ fontSize: "1.75rem" }}>Cuenta pendiente de aprobación</h2>
          <p className="section-subtitle">Tu registro fue recibido. Un administrador habilitará tu cuenta a la brevedad.</p>
          <Link to="/" className="btn-primary">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}

export default Pendiente;
