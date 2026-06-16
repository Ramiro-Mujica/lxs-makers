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
    <div className="home-page page-shell">
      <div className="page-container">
        <div className="home-hero">
          <h1 className="section-title">Bienvenido a LXS Makers</h1>
          <p className="section-subtitle mt-lg">Encontrá tu tienda o consultá el estado de tu pedido desde una experiencia más clara y moderna.</p>
        </div>

        <div className="home-grid">
          <section className="card home-card">
            <div>
              <h2 className="section-title" style={{ fontSize: "1.4rem" }}>Buscar catálogo</h2>
              <p className="section-subtitle">Ingresá el código de la tienda para ver sus productos disponibles.</p>
            </div>
            <input className="input" type="text" placeholder="Código de la tienda" value={codigoCatalogo} onChange={(e) => setCodigoCatalogo(e.target.value)} />
            <button className="btn-primary" onClick={buscarCatalogo}>Buscar tienda</button>
          </section>

          <section className="card home-card">
            <div>
              <h2 className="section-title" style={{ fontSize: "1.4rem" }}>Consultar seguimiento</h2>
              <p className="section-subtitle">Ingresá tu código de 8 caracteres para ver el estado del pedido.</p>
            </div>
            <input className="input" type="text" placeholder="Código de seguimiento" maxLength={8} value={codigoSeguimiento} onChange={(e) => setCodigoSeguimiento(e.target.value)} />
            <button className="btn-secondary" onClick={consultarSeguimiento}>Consultar pedido</button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Inicio;
