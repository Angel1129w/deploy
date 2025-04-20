import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from '../config/googleAuth';
import { signInWithPopup } from 'firebase/auth';

const Loginr = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [cedula, setCedula] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [foto, setFoto] = useState("");
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => detenerCamara();
  }, []);

  const iniciarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      setError("No se pudo acceder a la cámara.");
    }
  };

  const detenerCamara = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const capturarFoto = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setFoto(dataUrl);
    setError("");
  };

  const iniciarSesionConGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      
      // Verificar si el correo existe en la base de datos y obtener la cédula
      const responseEmail = await fetch("http://localhost:8080/verificar-correo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      const dataEmail = await responseEmail.json();
      if (!dataEmail.success) {
        setError("El correo no está registrado en el sistema.");
        return;
      }
      
      // Si no hay foto capturada, mostrar error
      if (!foto) {
        setError("Por favor, capture una foto para la verificación facial.");
        return;
      }
      
      // Verificar el rostro con la cédula obtenida
      const response = await fetch("http://localhost:8080/verificar-rostro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cedula: dataEmail.cedula,
          foto: foto
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        const fechaHoraActual = new Date().toISOString();
        await fetch("http://localhost:8080/actualizar-ultima-sesion", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cedula: dataEmail.cedula, ultimaSesion: fechaHoraActual }),
        });
        navigate("/");
      } else {
        setError("La verificación facial ha fallado.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error al iniciar sesión con Google.");
    }
  };

  const iniciarSesion = async () => {
    if (!cedula || !contrasena || !foto) {
      setError("Por favor, completa todos los campos y captura una foto.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula, contrasena, foto }),
      });

      const data = await response.json();
      if (data.success) {
        setIsAuthenticated(true);
        alert("Inicio de sesión exitoso");

        // Registrar la hora y fecha de inicio de sesión
        const fechaHoraActual = new Date().toISOString();
        await fetch("http://localhost:8080/actualizar-ultima-sesion", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cedula, ultimaSesion: fechaHoraActual }),
        });

        navigate("/");
      } else {
        alert(data.error || "Error al iniciar sesión");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con el servidor");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>
      {error && <p className="text-red-500">{error}</p>}

      <input
        type="text"
        placeholder="Cédula"
        value={cedula}
        onChange={(e) => setCedula(e.target.value)}
        className="w-full p-2 mb-2 border rounded"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />

      <div className="mb-4">
        <video ref={videoRef} autoPlay className="rounded-md" width="300" height="200"></video>
        <canvas ref={canvasRef} width="300" height="200" style={{ display: "none" }}></canvas>

        <div className="flex gap-2 mt-2">
          <button onClick={iniciarCamara} className="bg-green-600 text-white px-3 py-1 rounded">Activar Cámara</button>
          <button onClick={capturarFoto} className="bg-blue-600 text-white px-3 py-1 rounded">Capturar Foto</button>
          <button onClick={iniciarSesion} className="bg-indigo-600 text-white px-3 py-1 rounded">Iniciar Sesión</button>
          <button onClick={iniciarSesionConGoogle} className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
            </svg>
            Iniciar con Google
          </button>
        </div>
      </div>

      {foto && (
        <div className="mt-4">
          <p className="font-semibold">Foto Capturada:</p>
          <img src={foto} alt="Captura" className="border rounded-md mt-2" width="200" />
        </div>
      )}
    </div>
  );
};

export default Loginr;
