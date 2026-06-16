// frontend/src/pages/Registro.jsx
import { Link } from "react-router-dom";

function Registro() {
  return (
    <div style={styles.container}>
      <h2>Registro de vendedor</h2>
      <p>— Próximamente —</p>
      <Link to="/">← Volver al inicio</Link>
    </div>
  );
}

const styles = {
  container: { maxWidth: "400px", margin: "4rem auto", textAlign: "center" },
};

export default Registro;
