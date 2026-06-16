// frontend/src/pages/Inicio.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Inicio() {
  const navigate = useNavigate();
  const [codigoCatalogo,    setCodigoCatalogo]    = useState("");
  const [codigoSeguimiento, setCodigoSeguimiento] = useState("");

  const buscarCatalogo = () => {
    if (codigoCatalogo.trim()) navigate(`/catalogo/${codigoCatalogo.trim().toUpperCase()}`);
  };

  const consultarSeguimiento = () => {
    if (codigoSeguimiento.trim()) navigate(`/seguimiento/${codigoSeguimiento.trim().toUpperCase()}`);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.titulo}>Bienvenido a LXS Makers</h1>
      <p style={styles.subtitulo}>Encontrá tu tienda o consultá tu pedido</p>

      <div style={styles.card}>
        <h2>Ver catálogo de una tienda</h2>
        <input style={styles.input} type="text" placeholder="Ingresá el código de la tienda" value={codigoCatalogo} onChange={(e) => setCodigoCatalogo(e.target.value)} />
        <button style={styles.boton} onClick={buscarCatalogo}>Buscar tienda</button>
      </div>

      <div style={styles.card}>
        <h2>Consultar estado de tu pedido</h2>
        <input style={styles.input} type="text" placeholder="Ingresá tu código de seguimiento (8 caracteres)" maxLength={8} value={codigoSeguimiento} onChange={(e) => setCodigoSeguimiento(e.target.value)} />
        <button style={styles.boton} onClick={consultarSeguimiento}>Consultar pedido</button>
      </div>
    </div>
  );
}

const styles = {
  container:  { maxWidth: "600px", margin: "4rem auto", padding: "0 1rem", textAlign: "center" },
  titulo:     { fontSize: "2rem", color: "#1a1a2e", marginBottom: "0.5rem" },
  subtitulo:  { color: "#666", marginBottom: "2rem" },
  card:       { backgroundColor: "#f9f9f9", borderRadius: "12px", padding: "2rem", marginBottom: "1.5rem", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  input:      { width: "100%", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #ddd", fontSize: "1rem", marginBottom: "1rem", boxSizing: "border-box" },
  boton:      { backgroundColor: "#e94560", color: "#fff", border: "none", borderRadius: "8px", padding: "0.75rem 2rem", fontSize: "1rem", cursor: "pointer" },
};

export default Inicio;
