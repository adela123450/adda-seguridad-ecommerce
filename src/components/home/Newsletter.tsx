export const Newsletter = () => {
  return (
    <section className="relative overflow-hidden py-20 min-h-[420px]">
      {/* Fondo completo */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70 h-full"
        style={{
          backgroundImage: "url('/background-blanco.jpg')",
          backgroundPosition: "right center",
        }}
      />

      {/* Capa suave para mejorar lectura */}
      <div className="absolute inset-0 bg-slate-100/5"/>

      {/* Contenido */}
      <div className="container z-10 relative p-5 md:p-0 items-center justify-between">
        <div className="w-full text-black bg-white p-12 space-y5  border-[1px] border-slate-300 md:w-[50%] lg:w-[40%] lg:ml-16">
          <p className="text-xs uppercase font-semibold">
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