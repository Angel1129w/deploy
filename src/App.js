import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import Register from "./components/Register";
import UpdateUser from "./components/UpdateUser";
import Loginr from "./components/Loginr";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <div className="font-sans">
        <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/login" element={<Loginr setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/actualizar-usuario" element={<UpdateUser />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

function Navbar({ isAuthenticated, setIsAuthenticated }) {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    setIsAuthenticated(false);
    navigate("/");
  };

  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-between items-center">
      <h1 className="text-2xl font-bold">QRTIXPRO</h1>
      <div className="flex gap-4">
        <Link to="/" className="hover:underline">Inicio</Link>
        {!isAuthenticated ? (
          <>
            <Link to="/registro" className="hover:underline">Registrar</Link>
            <Link to="/login" className="hover:underline">Iniciar Sesión</Link>
          </>
        ) : (
          <>
            <Link to="/actualizar-usuario" className="hover:underline">Actualizar Usuario</Link>
            <button onClick={cerrarSesion} className="hover:underline">Cerrar Sesión</button>
          </>
        )}
      </div>
    </nav>
  );
}

function Home() {
  return (
    <div>
      <Slider />
      <CategoryList />
      <EventList />
    </div>
  );
}

function Slider() {
  return (
    <Carousel showThumbs={false} infiniteLoop autoPlay>
      <div>
        <img src="img/festival.png" alt="Evento 1" style={{ width: "100%", height: "400px", objectFit: "cover" }} />
        <p className="legend">Festival de Música</p>
      </div>
      <div>
        <img src="img/nacional.jpg" alt="Evento 2" style={{ width: "100%", height: "400px", objectFit: "cover" }} />
        <p className="legend">Partido de Fútbol</p>
      </div>
    </Carousel>
  );
}

function CategoryList() {
  const categories = ["Conciertos", "Teatro", "Deportes", "Festivales"];
  return (
    <div className="flex justify-center gap-4 my-6">
      {categories.map((category, index) => (
        <button key={index} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">{category}</button>
      ))}
    </div>
  );
}

function EventList() {
  const events = [
    { id: 1, name: "Concierto de Rock", img: "https://via.placeholder.com/300x200", price: "$50" },
    { id: 2, name: "Obra de Teatro", img: "https://via.placeholder.com/300x200", price: "$30" },
    { id: 3, name: "Final de Fútbol", img: "/img/futbol.jpg", price: "$70" },
    { id: 4, name: "Festival de Jazz", img: "https://via.placeholder.com/300x200", price: "$40" }
  ];

  return (
    <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {events.map((event) => (
        <div key={event.id} className="border p-4 rounded-lg shadow-lg">
          <img src={event.img} alt={event.name} className="w-full rounded-md" />
          <h3 className="text-lg font-bold mt-2">{event.name}</h3>
          <p className="text-gray-700">Precio: {event.price}</p>
          <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded-md">Comprar</button>
        </div>
      ))}
    </div>
  );
}

function Registro() {
  return (
    <div className="p-6 max-w-md mx-auto">
      <Register />
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-800 text-white p-6 text-center mt-8">
      <p>&copy; 2025 QRTIXPRO - Todos los derechos reservados.</p>
    </footer>
  );
}

export default App;
