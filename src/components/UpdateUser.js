import React, { useState } from 'react';

const UpdateUser = () => {
  const [userData, setUserData] = useState({
    cedula: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    contrasena: '',
    foto: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (action) => {
    try {
      if (!userData.cedula) {
        alert('Por favor, ingrese una cédula');
        return;
      }

      let url = '';
      let method = '';
      let body = {};

      switch (action) {
        case 'buscar':
          url = 'http://localhost:8080/obtener-usuario';
          method = 'POST';
          body = JSON.stringify({ cedula: userData.cedula });
          break;
        case 'actualizar':
          url = 'http://localhost:8080/actualizar-usuario';
          method = 'PUT';
          body = JSON.stringify(userData);
          break;
        case 'eliminar':
          if (!window.confirm('¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer.')) {
            return;
          }
          url = 'http://localhost:8080/eliminar-usuario';
          method = 'DELETE';
          body = JSON.stringify({ cedula: userData.cedula });
          break;
        default:
          return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body
      });

      const data = await response.json();
      if (response.ok) {
        if (action === 'buscar') {
          if (data.data) {
            setUserData(data.data);
            alert('Datos del usuario obtenidos exitosamente');
          } else {
            alert('No se encontraron datos para esta cédula');
          }
        } else {
          alert(data.mensaje || `Operación ${action} realizada exitosamente`);
          if (action === 'eliminar') {
            window.location.href = '/login';
          }
        }
      } else {
        throw new Error(data.error || `Error al ${action} usuario: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error al ${action} usuario:`, error);
      alert(error.message || `Error al ${action} usuario. Por favor, intente nuevamente`);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Actualizar Usuario</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cédula</label>
          <input
            type="text"
            name="cedula"
            value={userData.cedula}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input
            type="text"
            name="nombres"
            value={userData.nombres}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Apellido</label>
          <input
            type="text"
            name="apellidos"
            value={userData.apellidos}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Correo</label>
          <input
            type="email"
            name="correo"
            value={userData.correo}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="text"
            name="telefono"
            value={userData.telefono}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            type="password"
            name="contrasena"
            value={userData.contrasena}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleSubmit('buscar')}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            Obtener Datos
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('actualizar')}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('eliminar')}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Eliminar
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateUser;