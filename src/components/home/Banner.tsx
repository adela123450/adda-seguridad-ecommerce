import { Link } from "react-router-dom";

export const Banner = () => {
  return (
    <div className="relative text-white min-h-[500px] overflow-hidden">
      
      {/* IMAGEN DE FONDO */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
        backgroundImage: "url('/img/img-banner.jpg')",
        backgroundPosition: "center 58%"
      }}
      />

      {/* OVERLAY (oscurecer imagen) */}
      <div className="absolute inset-0 bg-black/40" />

      {/* CONTENIDO */}
      <div className="relative z-10 flex min-h-[500px] flex-col items-center justify-center text-center px-4">
        
        <h1 className="text-4xl font-bold mb-4 lg:text-6xl">
          Los mejores equipos de seguridad
        </h1>

        <p className="text-lg mb-8 lg:text-2xl">
          Descubre las ofertas exclusivas y nuestra nueva colección
        </p>

        <Link
          to="/products"
          className="bg-blue-900 hover:bg-gray-950 text-white font-semibold py-3 px-6 rounded-lg shadow-lg"
        >
          Ver productos
        </Link>
      </div>
    </div>
  );
};