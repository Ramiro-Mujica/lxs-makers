// frontend/src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Error al iniciar sesión.");
        return;
      }

      // Guardar token y rol en localStorage
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("rol", data.rol);
      localStorage.setItem("estado", data.estado);

      // Redirigir según rol y estado
      if (data.rol === "administrador") {
        navigate("/admin");
      } else if (data.rol === "vendedor" && data.estado === "activo") {
        navigate("/vendedor");
      } else if (data.rol === "vendedor" && data.estado === "pendiente") {
        navigate("/pendiente");
      } else {
        setError("Tu cuenta está deshabilitada. Contactá al administrador.");
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.titulo}>Iniciar sesión</h2>
        <p style={styles.subtitulo}>Accedé a tu panel de LXS Makers</p>

        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={handleChange}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={loading ? styles.botonDesactivado : styles.boton}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <div style={styles.links}>
          <Link to="/registro" style={styles.link}>¿No tenés cuenta? Registrate</Link>
          <Link to="/" style={styles.linkVolver}>← Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    padding: "1rem",
  },
  card: {
    backgroundColor: "#f9f9f9",
    borderRadius: "12px",
    padding: "2.5rem",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  titulo: {
    fontSize: "1.8rem",
    color: "#1a1a2e",
    margin: 0,
    textAlign: "center",
  },
  subtitulo: {
    color: "#666",
    textAlign: "center",
    margin: 0,
    fontSize: "0.95rem",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "1rem",
    boxSizing: "border-box",
  },
  boton: {
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.75rem",
    fontSize: "1rem",
    cursor: "pointer",
    width: "100%",
  },
  botonDesactivado: {
    backgroundColor: "#ccc",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.75rem",
    fontSize: "1rem",
    cursor: "not-allowed",
    width: "100%",
  },
  error: {
    color: "#e94560",
    fontSize: "0.9rem",
    textAlign: "center",
    margin: 0,
  },
  links: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.5rem",
  },
  link: {
    color: "#e94560",
    textDecoration: "none",
    fontSize: "0.9rem",
  },
  linkVolver: {
    color: "#666",
    textDecoration: "none",
    fontSize: "0.9rem",
  },
};

export default Login;