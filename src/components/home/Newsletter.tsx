export const Newsletter = () => {
  return (
    <section className="relative overflow-hidden py-20 min-h-[420px]">
      {/* Fondo completo */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url('/background-blanco.jpg')",
          backgroundPosition: "right center",
        }}
      />

      {/* Capa suave para mejorar lectura */}
      <div className="absolute inset-0 bg-slate-100/5" />

      {/* Contenido */}
      <div className="container relative z-10 flex min-h-[420px] items-center px-6 md:px-10 lg:px-16">
        <div className="w-full bg-white p-8 shadow-lg md:w-[55%] lg:w-[42%]">
          <p className="text-xs font-semibold uppercase text-black">
            Suscríbete a nuestro boletín y recibe promociones exclusivas
          </p>

          <p className="mt-4 text-xs font-medium leading-5 text-gray-700">
            Introduce tu correo para recibir ofertas especiales, novedades y
            consejos de seguridad.
          </p>

          <form className="mt-6 flex flex-col gap-4 xl:flex-row">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="w-full rounded-full border border-slate-300 px-5 py-3 text-black focus:outline-none"
            />

            <button
              type="submit"
              className="rounded-full bg-black px-6 py-3 font-semibold uppercase tracking-wide text-white"
            >
              Suscribirme
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};