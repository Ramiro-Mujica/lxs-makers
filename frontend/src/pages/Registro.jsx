// frontend/src/pages/Registro.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmar_password: "",
    nombre_negocio: "",
    whatsapp: "",
  });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [exitoso, setExitoso]   = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");

    if (form.password !== form.confirmar_password) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:          form.email,
          password:       form.password,
          nombre_negocio: form.nombre_negocio,
          whatsapp:       form.whatsapp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Error al registrarse.");
        return;
      }

      setExitoso(true);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de éxito tras el registro
  if (exitoso) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.iconoExito}>✓</div>
          <h2 style={styles.titulo}>¡Registro exitoso!</h2>
          <p style={styles.subtitulo}>
            Tu cuenta está <strong>pendiente de aprobación</strong>. 
            El administrador revisará tu solicitud y te habilitará para usar tu panel.
          </p>
          <Link to="/" style={styles.botonLink}>← Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.titulo}>Crear cuenta</h2>
        <p style={styles.subtitulo}>Registrate como vendedor en LXS Makers</p>

        <input
          style={styles.input}
          type="text"
          name="nombre_negocio"
          placeholder="Nombre de tu negocio"
          value={form.nombre_negocio}
          onChange={handleChange}
        />
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
          type="text"
          name="whatsapp"
          placeholder="WhatsApp (ej: 5491112345678)"
          value={form.whatsapp}
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
        <input
          style={styles.input}
          type="password"
          name="confirmar_password"
          placeholder="Confirmar contraseña"
          value={form.confirmar_password}
          onChange={handleChange}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={loading ? styles.botonDesactivado : styles.boton}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Registrando..." : "Crear cuenta"}
        </button>

        <div style={styles.links}>
          <Link to="/login" style={styles.link}>¿Ya tenés cuenta? Iniciá sesión</Link>
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
  iconoExito: {
    fontSize: "3rem",
    color: "#e94560",
    textAlign: "center",
  },
  botonLink: {
    backgroundColor: "#e94560",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "0.75rem",
    fontSize: "1rem",
    cursor: "pointer",
    width: "100%",
    textAlign: "center",
    textDecoration: "none",
    boxSizing: "border-box",
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

export default Registro;