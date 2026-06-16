import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">LXS Makers</Link>
        <div className="navbar__links">
          {[
            { to: "/", label: "Inicio" },
            { to: "/registro", label: "Registro" },
            { to: "/login", label: "Ingresar" },
          ].map((item) => {
            const isActive = item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`navbar__link ${isActive ? "is-active" : ""}`.trim()}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
