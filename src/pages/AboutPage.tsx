export const AboutPage = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      {/* HERO PREMIUM */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-gradient-to-r from-[#2D5398] via-[#234684] to-[#111827] shadow-lg">
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute left-10 bottom-0 h-56 w-56 rounded-full bg-blue-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-14 md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-blue-100">
            SOBRE ADDA SEGURIDAD
          </p>

          <h1 className="mt-3 max-w-4xl text-3xl font-bold text-white md:text-5xl">
            Soluciones de seguridad con enfoque profesional
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            En ADDA Seguridad trabajamos para ofrecer equipos confiables,
            asesoría técnica y soluciones integrales en videovigilancia,
            almacenamiento, redes y tecnología aplicada a la protección de
            hogares, negocios e instituciones.
          </p>
        </div>
      </div>

      {/* BLOQUE 1 */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
            Quiénes somos
          </h2>

          <p className="mt-4 text-justify leading-8 tracking-normal text-slate-600">
            ADDA Seguridad es una empresa orientada al suministro, instalación
            y acompañamiento técnico en soluciones de seguridad electrónica.
            Nuestro enfoque combina tecnología, atención personalizada y
            criterio profesional para ayudar a cada cliente a elegir la opción
            más adecuada según su necesidad.
          </p>

          <p className="mt-4 text-justify leading-8 tracking-normal text-slate-600">
            Trabajamos con un portafolio enfocado en sistemas CCTV,
            almacenamiento, accesorios, redes y soporte técnico, brindando una
            experiencia más clara, confiable y útil tanto para proyectos
            residenciales como comerciales e institucionales.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
            Nuestra propuesta de valor
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 transition duration-300 hover:shadow-md">
              <h3 className="font-semibold text-slate-800">
                Atención personalizada
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Recomendaciones orientadas a cada proyecto, sin soluciones
                genéricas.
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 transition duration-300 hover:shadow-md">
              <h3 className="font-semibold text-slate-800">
                Equipos confiables
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Portafolio pensado para brindar desempeño, durabilidad y buena
                relación costo-beneficio.
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 transition duration-300 hover:shadow-md">
              <h3 className="font-semibold text-slate-800">Soporte técnico</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Acompañamiento en selección, instalación y uso de los equipos.
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 transition duration-300 hover:shadow-md">
              <h3 className="font-semibold text-slate-800">
                Soluciones integrales
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                CCTV, almacenamiento, accesorios y redes en una sola propuesta.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BLOQUE 2 */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-md transition duration-300 hover:shadow-xl">
        <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
          Qué ofrecemos
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h3 className="font-semibold text-slate-800">
              Venta de equipos CCTV
            </h3>
            <p className="mt-2 text-justify text-sm leading-6 text-slate-600">
              Cámaras, grabadores, almacenamiento y accesorios para diferentes
              escenarios de seguridad.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h3 className="font-semibold text-slate-800">
              Instalación profesional
            </h3>
            <p className="mt-2 text-justify text-sm leading-6 text-slate-600">
              Montaje y puesta en marcha de soluciones adaptadas a hogares,
              comercios y espacios institucionales.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h3 className="font-semibold text-slate-800">
              Soporte y mantenimiento
            </h3>
            <p className="mt-2 text-justify text-sm leading-6 text-slate-600">
              Acompañamiento técnico, revisión de equipos y mejora de
              funcionamiento en sistemas instalados.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h3 className="font-semibold text-slate-800">
              Asesoría tecnológica
            </h3>
            <p className="mt-2 text-justify text-sm leading-6 text-slate-600">
              Brindamos acompañamiento profesional para definir la solución de
              seguridad más conveniente de acuerdo con el tipo de proyecto, las
              necesidades del lugar y el presupuesto disponible. También
              realizamos visitas técnicas en sitio para levantar información,
              evaluar condiciones de instalación y cotizar un sistema más
              preciso y eficiente. Este servicio tiene costo, informado
              previamente al cliente.
            </p>
          </div>
        </div>
      </div>

      {/* CTA FINAL */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#1e3a8a] px-8 py-10 text-center text-white shadow-md">
        <h2 className="text-2xl font-bold md:text-3xl">
          ¿Quieres cotizar una solución de seguridad?
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-slate-300">
          Te ayudamos a encontrar equipos y soluciones adecuadas para tu hogar,
          negocio o proyecto institucional.
        </p>

        <a
          href="https://wa.me/573015068866?text=Hola,%20quiero%20más%20información%20sobre%20ADDA%20Seguridad"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-xl bg-[#2D5398] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#234684]"
        >
          Solicitar cotización por WhatsApp
        </a>
      </div>
    </section>
  );
};