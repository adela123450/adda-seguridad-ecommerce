import { FaWhatsapp } from "react-icons/fa";

export const Newsletter = () => {
  return (
    <section className="relative mt-10 min-h-[320px] overflow-hidden py-12">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{
          backgroundImage: "url('/background-blanco.jpg')",
          backgroundPosition: "right center",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-transparent" />

      <div className="relative mx-auto flex min-h-[320px] max-w-7xl items-center px-6 md:px-12">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
            ¿Cómo trabajamos en ADDA Seguridad?
          </h2>

          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
            Te acompañamos desde la asesoría inicial hasta la instalación y
            puesta en marcha de tu solución de seguridad.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700">
            <span>Asesoría</span>
            <span className="text-[#2D5398]">→</span>
            <span>Visita técnica</span>
            <span className="text-[#2D5398]">→</span>
            <span>Cotización</span>
            <span className="text-[#2D5398]">→</span>
            <span>Instalación</span>
          </div>

          <a
            href="https://wa.me/573015068866?text=Hola,%20quiero%20asesoría%20para%20una%20solución%20de%20seguridad."
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-700"
          >
            <FaWhatsapp size={18} />
            Solicitar asesoría
          </a>
        </div>
      </div>
    </section>
  );
};