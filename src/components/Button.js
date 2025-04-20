import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  outline = false,
  className = '',
  loading = false,
  icon = null,
  ...props 
}) => {
  // Definir clases base
  let buttonClasses = 'btn font-medium transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-opacity-50 ';
  
  // Añadir clases según la variante
  switch (variant) {
    case 'primary':
      buttonClasses += outline 
        ? 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white focus:ring-indigo-500 ' 
        : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 ';
      break;
    case 'secondary':
      buttonClasses += outline 
        ? 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white focus:ring-emerald-500 ' 
        : 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 ';
      break;
    case 'accent':
      buttonClasses += outline 
        ? 'border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white focus:ring-amber-400 ' 
        : 'bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 ';
      break;
    case 'danger':
      buttonClasses += outline 
        ? 'border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white focus:ring-red-500 ' 
        : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 ';
      break;
    default:
      buttonClasses += 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 ';
  }
  
  // Añadir clases según el tamaño
  switch (size) {
    case 'sm':
      buttonClasses += 'px-3 py-1 text-sm rounded ';
      break;
    case 'lg':
      buttonClasses += 'px-6 py-3 text-lg rounded-md ';
      break;
    case 'xl':
      buttonClasses += 'px-8 py-4 text-xl rounded-lg ';
      break;
    default: // md
      buttonClasses += 'px-4 py-2 rounded-md ';
  }
  
  // Añadir efecto hover
  buttonClasses += 'hover:scale-105 ';
  
  // Añadir clases personalizadas
  buttonClasses += className;
  
  return (
    <button 
      className={buttonClasses} 
      disabled={loading}
      {...props}
    >
      <div className="flex items-center justify-center">
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {icon && !loading && <span className="mr-2">{icon}</span>}
        {children}
      </div>
    </button>
  );
};

export default Button;