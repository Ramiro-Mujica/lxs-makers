// frontend/src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Error al iniciar sesión."); return; }

      localStorage.setItem("token",  data.access_token);
      localStorage.setItem("rol",    data.rol);
      localStorage.setItem("estado", data.estado);
      localStorage.setItem("userId", data.user_id);

      if (data.rol === "administrador")                           navigate("/admin");
      else if (data.rol === "vendedor" && data.estado === "activo")    navigate("/vendedor");
      else if (data.rol === "vendedor" && data.estado === "pendiente") navigate("/pendiente");
      else setError("Tu cuenta está deshabilitada.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page page-shell">
      <div className="center-page">
        <div className="card auth-card" style={{ width: "100%", maxWidth: "440px" }}>
          <div className="text-center">
            <h2 className="section-title" style={{ fontSize: "1.75rem" }}>Iniciar sesión</h2>
            <p className="section-subtitle">Accedé a tu panel de LXS Makers</p>
          </div>
          <input className="input" type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} />
          <input className="input" type="password" name="password" placeholder="Contraseña" value={form.password} onChange={handleChange} />
          {error && <p className="msg-error">{error}</p>}
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <div className="text-center">
            <Link to="/registro" className="link-accent">¿No tenés cuenta? Registrate</Link>
            <div style={{ height: "0.35rem" }} />
            <Link to="/" className="link-muted">← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
