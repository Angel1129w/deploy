import { useState, useRef, useEffect } from "react";
// Eliminando importaciones no utilizadas

export default function Registro() {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cedula, setCedula] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [foto, setFoto] = useState(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  
  // Estados para errores de validación
  const [errores, setErrores] = useState({
    nombres: "",
    apellidos: "",
    cedula: "",
    correo: "",
    telefono: "",
    contrasena: "",
    foto: ""
  });
  
  // Estado para mensaje de éxito
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [alertaVisible, setAlertaVisible] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Limpiar la cámara cuando el componente se desmonta
  useEffect(() => {
    const currentVideo = videoRef.current;
    return () => {
      if (currentVideo && currentVideo.srcObject) {
        currentVideo.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Efecto para mostrar alertas temporalmente
  useEffect(() => {
    if (mensajeExito || mensajeError) {
      setAlertaVisible(true);
      const timer = setTimeout(() => {
        setAlertaVisible(false);
        setTimeout(() => {
          setMensajeExito("");
          setMensajeError("");
        }, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mensajeExito, mensajeError]);
  
  // Funciones de validación
  const validarNombres = (valor) => {
    if (!valor.trim()) {
      return "El nombre es obligatorio";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
      return "El nombre solo debe contener letras";
    } else if (valor.length < 2) {
      return "El nombre debe tener al menos 2 caracteres";
    }
    return "";
  };
  
  const validarApellidos = (valor) => {
    if (!valor.trim()) {
      return "El apellido es obligatorio";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor)) {
      return "El apellido solo debe contener letras";
    } else if (valor.length < 2) {
      return "El apellido debe tener al menos 2 caracteres";
    }
    return "";
  };
  
  const validarCedula = (valor) => {
    if (!valor.trim()) {
      return "La cédula es obligatoria";
    } else if (!/^\d+$/.test(valor)) {
      return "La cédula solo debe contener números";
    } else if (valor.length < 5 || valor.length > 12) {
      return "La cédula debe tener entre 5 y 12 dígitos";
    }
    return "";
  };
  
  const validarCorreo = (valor) => {
    if (!valor.trim()) {
      return "El correo electrónico es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      return "Ingrese un correo electrónico válido";
    }
    return "";
  };
  
  const validarTelefono = (valor) => {
    if (!valor.trim()) {
      return "El teléfono es obligatorio";
    } else if (!/^\d+$/.test(valor)) {
      return "El teléfono solo debe contener números";
    } else if (valor.length < 7 || valor.length > 15) {
      return "El teléfono debe tener entre 7 y 15 dígitos";
    }
    return "";
  };
  
  const validarContrasena = (valor) => {
    if (!valor) {
      return "La contraseña es obligatoria";
    } else if (valor.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    } else if (!/[A-Z]/.test(valor)) {
      return "La contraseña debe contener al menos una letra mayúscula";
    } else if (!/[a-z]/.test(valor)) {
      return "La contraseña debe contener al menos una letra minúscula";
    } else if (!/[0-9]/.test(valor)) {
      return "La contraseña debe contener al menos un número";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(valor)) {
      return "La contraseña debe contener al menos un carácter especial";
    }
    return "";
  };
  
  const validarFoto = (valor) => {
    if (!valor) {
      return "Debe tomar una foto para el registro";
    }
    return "";
  };
  
  // Manejadores de cambio con validación
  const handleNombresChange = (e) => {
    const valor = e.target.value;
    setNombres(valor);
    setErrores({...errores, nombres: validarNombres(valor)});
  };
  
  const handleApellidosChange = (e) => {
    const valor = e.target.value;
    setApellidos(valor);
    setErrores({...errores, apellidos: validarApellidos(valor)});
  };
  
  const handleCedulaChange = (e) => {
    const valor = e.target.value;
    setCedula(valor);
    setErrores({...errores, cedula: validarCedula(valor)});
  };
  
  const handleCorreoChange = (e) => {
    const valor = e.target.value;
    setCorreo(valor);
    setErrores({...errores, correo: validarCorreo(valor)});
  };
  
  const handleTelefonoChange = (e) => {
    const valor = e.target.value;
    setTelefono(valor);
    setErrores({...errores, telefono: validarTelefono(valor)});
  };
  
  const handleContrasenaChange = (e) => {
    const valor = e.target.value;
    setContrasena(valor);
    setErrores({...errores, contrasena: validarContrasena(valor)});
  };

  // Iniciar la cámara
  const activarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      setCamaraActiva(true);
    } catch (error) {
      console.error("Error al activar la cámara:", error);
    }
  };

  // Tomar la foto
  const tomarFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Dibujar la imagen en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir a Base64
    const imageData = canvas.toDataURL("image/png");
    setFoto(imageData);
    setErrores({...errores, foto: ""});

    // Detener la cámara
    video.srcObject.getTracks().forEach((track) => track.stop());
    setCamaraActiva(false);
  };

  // Validar todos los campos
  const validarFormulario = () => {
    const nuevosErrores = {
      nombres: validarNombres(nombres),
      apellidos: validarApellidos(apellidos),
      cedula: validarCedula(cedula),
      correo: validarCorreo(correo),
      telefono: validarTelefono(telefono),
      contrasena: validarContrasena(contrasena),
      foto: validarFoto(foto)
    };
    
    setErrores(nuevosErrores);
    
    // Verificar si hay errores
    return !Object.values(nuevosErrores).some(error => error !== "");
  };

  // Enviar datos al backend
  const registrarUsuario = async () => {
    setMensajeExito("");
    setMensajeError("");
    
    // Validar todos los campos antes de enviar
    if (!validarFormulario()) {
      setMensajeError("Por favor, corrija los errores antes de continuar.");
      return;
    }
    
    setCargando(true);
    
    try {
      const response = await fetch("http://localhost:8080/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres,
          apellidos,
          cedula,
          correo,
          telefono,
          contrasena,
          foto
        })
      });

      const data = await response.json();
      
      if (data.status === "success") {
        setMensajeExito("Usuario registrado con éxito");
        // Limpiar el formulario
        setNombres("");
        setApellidos("");
        setCedula("");
        setCorreo("");
        setTelefono("");
        setContrasena("");
        setFoto(null);
        setErrores({
          nombres: "",
          apellidos: "",
          cedula: "",
          correo: "",
          telefono: "",
          contrasena: "",
          foto: ""
        });
      } else {
        setMensajeError(data.mensaje || "Error al registrar usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      setMensajeError("Error de conexión. Intente nuevamente.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 fixed inset-0">
      <div className="max-w-md w-full space-y-6 bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-gray-100 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Registro de Usuario</h2>
        </div>
      
        {alertaVisible && mensajeExito && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center mb-4">
            {mensajeExito}
          </div>
        )}
        
        {alertaVisible && mensajeError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center mb-4">
            {mensajeError}
          </div>
        )}
        
        <form className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2 text-center">Nombres</label>
            <input 
              className={`border p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errores.nombres ? 'border-red-500' : 'border-gray-300'}`} 
              type="text" 
              placeholder="Ingrese sus nombres" 
              value={nombres}
              onChange={handleNombresChange} 
            />
            {errores.nombres && <p className="text-red-500 text-xs mt-1 text-center">{errores.nombres}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2 text-center">Apellidos</label>
            <input 
              className={`border p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errores.apellidos ? 'border-red-500' : 'border-gray-300'}`} 
              type="text" 
              placeholder="Ingrese sus apellidos" 
              value={apellidos}
              onChange={handleApellidosChange} 
            />
            {errores.apellidos && <p className="text-red-500 text-xs mt-1 text-center">{errores.apellidos}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2 text-center">Cédula</label>
            <input 
              className={`border p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errores.cedula ? 'border-red-500' : 'border-gray-300'}`} 
              type="text" 
              placeholder="Ingrese su número de cédula" 
              value={cedula}
              onChange={handleCedulaChange} 
            />
            {errores.cedula && <p className="text-red-500 text-xs mt-1 text-center">{errores.cedula}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2 text-center">Correo Electrónico</label>
            <input 
              className={`border p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errores.correo ? 'border-red-500' : 'border-gray-300'}`} 
              type="email" 
              placeholder="ejemplo@correo.com" 
              value={correo} 
              onChange={handleCorreoChange} 
            />
            {errores.correo && <p className="text-red-500 text-xs mt-1 text-center">{errores.correo}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2 text-center">Teléfono</label>
            <input 
              className={`border p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errores.telefono ? 'border-red-500' : 'border-gray-300'}`} 
              type="text" 
              placeholder="Ingrese su número de teléfono" 
              value={telefono}
              onChange={handleTelefonoChange} 
            />
            {errores.telefono && <p className="text-red-500 text-xs mt-1 text-center">{errores.telefono}</p>}
          </div>
          
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2 text-center">Contraseña</label>
            <input 
              className={`border p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errores.contrasena ? 'border-red-500' : 'border-gray-300'}`} 
              type="password" 
              placeholder="Ingrese una contraseña segura" 
              value={contrasena}
              onChange={handleContrasenaChange} 
            />
            {errores.contrasena && <p className="text-red-500 text-xs mt-1 text-center">{errores.contrasena}</p>}
          </div>

          <div className="space-y-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2 text-center">Foto de Perfil</label>
            <video ref={videoRef} className={`w-full border rounded-lg ${!camaraActiva ? 'hidden' : ''}`} autoPlay></video>
            <canvas ref={canvasRef} className="hidden" width={300} height={200}></canvas>

            <div className="flex justify-center space-x-4">
              {!camaraActiva ? (
                <button 
                  type="button"
                  className="bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200" 
                  onClick={activarCamara}
                >
                  Activar Cámara
                </button>
              ) : (
                <>
                  <button 
                    type="button"
                    className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200" 
                    onClick={tomarFoto}
                  >
                    Tomar Foto
                  </button>
                  <button 
                    type="button"
                    className="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-semibold transition-colors duration-200" 
                    onClick={() => {
                      if (videoRef.current && videoRef.current.srcObject) {
                        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                        setCamaraActiva(false);
                      }
                    }}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
            {errores.foto && <p className="text-red-500 text-xs mt-1 text-center">{errores.foto}</p>}
          </div>

          {foto && (
            <div className="text-center">
              <p className="text-sm font-bold mb-2">Vista previa:</p>
              <img src={foto} alt="Foto tomada" className="w-64 h-64 object-cover mx-auto border rounded-lg" />
            </div>
          )}

          <button 
            type="button"
            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors duration-200 ${cargando ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 transform hover:shadow-lg'}`} 
            onClick={registrarUsuario}
            disabled={cargando}
          >
            {cargando ? 'Procesando...' : 'Registrar Usuario'}
          </button>
        </form>
      </div>
    </div>
  );
}
