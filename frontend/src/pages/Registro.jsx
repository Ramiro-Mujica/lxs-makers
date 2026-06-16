// frontend/src/pages/Registro.jsx
import { useState } from "react";
import { Link } from "react-router-dom";

function Registro() {
  const [form,    setForm]    = useState({ email: "", password: "", confirmar_password: "", nombre_negocio: "", whatsapp: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [exitoso, setExitoso] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    if (form.password !== form.confirmar_password) { setError("Las contraseñas no coinciden."); return; }
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const res  = await fetch("http://127.0.0.1:8000/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password, nombre_negocio: form.nombre_negocio, whatsapp: form.whatsapp }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Error al registrarse."); return; }
      setExitoso(true);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (exitoso) return (
    <div className="auth-page page-shell">
      <div className="center-page">
        <div className="card auth-card" style={{ width: "100%", maxWidth: "440px", textAlign: "center" }}>
          <div className="stat-number" style={{ lineHeight: 1 }}>✓</div>
          <h2 className="section-title" style={{ fontSize: "1.75rem" }}>¡Registro exitoso!</h2>
          <p className="section-subtitle">Tu cuenta está <strong>pendiente de aprobación</strong>. El administrador revisará tu solicitud.</p>
          <Link to="/" className="btn-primary">← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-page page-shell">
      <div className="center-page">
        <div className="card auth-card" style={{ width: "100%", maxWidth: "440px" }}>
          <div className="text-center">
            <h2 className="section-title" style={{ fontSize: "1.75rem" }}>Crear cuenta</h2>
            <p className="section-subtitle">Registrate como vendedor en LXS Makers</p>
          </div>
          <input className="input" type="text" name="nombre_negocio" placeholder="Nombre de tu negocio" value={form.nombre_negocio} onChange={handleChange} />
          <input className="input" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input className="input" type="text" name="whatsapp" placeholder="WhatsApp (ej: 5491112345678)" value={form.whatsapp} onChange={handleChange} />
          <input className="input" type="password" name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} />
          <input className="input" type="password" name="confirmar_password" placeholder="Confirmar contraseña" value={form.confirmar_password} onChange={handleChange} />
          {error && <p className="msg-error">{error}</p>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Registrando..." : "Crear cuenta"}
          </button>
          <div className="text-center">
            <Link to="/login" className="link-accent">¿Ya tenés cuenta? Iniciá sesión</Link>
            <div style={{ height: "0.35rem" }} />
            <Link to="/" className="link-muted">← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Registro;
