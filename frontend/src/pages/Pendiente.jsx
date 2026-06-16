// frontend/src/pages/Pendiente.jsx
import { Link } from "react-router-dom";

function Pendiente() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icono}>⏳</div>
        <h2 style={styles.titulo}>Cuenta pendiente de aprobación</h2>
        <p style={styles.texto}>
          Tu registro fue recibido correctamente. Un administrador revisará 
          tu solicitud y habilitará tu cuenta a la brevedad.
        </p>
        <Link to="/" style={styles.boton}>← Volver al inicio</Link>
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
    maxWidth: "480px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    textAlign: "center",
  },
  icono: {
    fontSize: "3rem",
  },
  titulo: {
    fontSize: "1.5rem",
    color: "#1a1a2e",
    margin: 0,
  },
  texto: {
    color: "#666",
    lineHeight: "1.6",
    margin: 0,
  },
  boton: {
    backgroundColor: "#e94560",
    color: "#fff",
    borderRadius: "8px",
    padding: "0.75rem 2rem",
    textDecoration: "none",
    fontSize: "1rem",
    marginTop: "0.5rem",
  },
};

export default Pendiente;