// frontend/src/pages/Login.jsx
import { Link } from "react-router-dom";

function Login() {
  return (
    <div style={styles.container}>
      <h2>Iniciar sesión</h2>
      <p>— Próximamente —</p>
      <Link to="/">← Volver al inicio</Link>
    </div>
  );
}

const styles = {
  container: { maxWidth: "400px", margin: "4rem auto", textAlign: "center" },
};

export default Login;
