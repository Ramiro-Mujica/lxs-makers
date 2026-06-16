// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Pendiente from "./pages/Pendiente";
import PanelAdmin from "./pages/PanelAdmin";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"         element={<Inicio />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/pendiente" element={<Pendiente />} />
        <Route path="/admin"    element={<PanelAdmin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;