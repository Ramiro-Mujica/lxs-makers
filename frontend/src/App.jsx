// frontend/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Inicio />} />
        <Route path="/login"     element={<Login />} />
        <Route path="/registro"  element={<Registro />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
