import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const AboutPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace("#", "");
    const element = document.getElementById(id);

    if (element) {
      const yOffset = -110;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, [location.hash]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      {/* HERO PREMIUM */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] shadow-xl">
        <div className="relative px-6 py-12 md:px-8 md:py-14">
          <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-8 bottom-0 h-32 w-32 rounded-full bg-blue-200/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50">
              SOBRE ADDA SEGURIDAD
            </span>

            <h1 className="mt-4 max-w-4xl text-2xl font-bold text-white md:text-4xl">
              Soluciones de seguridad con enfoque profesional
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100 md:text-lg md:leading-8">
              En ADDA Seguridad S.A.S. trabajamos para ofrecer equipos
              confiables, asesoría técnica y soluciones integrales en
              videovigilancia, almacenamiento, redes y tecnología aplicada a la
              protección de hogares, negocios e instituciones.
            </p>
          </div>
        </div>
      </div>

      {/* BLOQUE 1 */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
            Quiénes somos
          </h2>

          <p className="mt-4 text-justify leading-8 tracking-normal text-slate-600">
            ADDA Seguridad S.A.S. es una empresa orientada al suministro,
            instalación y acompañamiento técnico en soluciones de seguridad
            electrónica. Nuestro enfoque combina tecnología, atención
            personalizada y criterio profesional para ayudar a cada cliente a
            elegir la opción más adecuada según su necesidad.
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
      <div
        id="que-ofrecemos"
        className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-md transition duration-300 hover:shadow-xl"
      >
        <h2 className="border-l-4 border-[#2D5398] pl-4 text-2xl font-bold text-slate-800">
          Qué ofrecemos
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-5">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
            <h3 className="font-semibold text-slate-800">
              Venta de equipos CCTV
            </h3>
            <p className="mt-2 text-justify text-sm leading-6 text-slate-600">
              Cámaras, grabadores, almacenamiento y accesorios para diferentes
              escenarios de seguridad.
            </p>
          </div>

          <div
            id="instalacion"
            className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-cyan-50 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <h3 className="font-semibold text-slate-800">
              Instalación CCTV
            </h3>
            <p className="mt-2 text-justify text-sm leading-6 text-slate-600">
              Montaje y puesta en marcha de soluciones adaptadas a hogares,
              comercios y espacios institucionales.
            </p>

            <p className="mt-3 text-justify text-sm leading-6 text-slate-600">
              Este servicio puede iniciar con una revisión técnica del lugar,
              donde se analiza el entorno, se toman medidas, se evalúan puntos
              estratégicos de instalación, condiciones eléctricas, recorridos de
              cableado y necesidades reales del proyecto.
            </p>

            <p className="mt-3 text-justify text-sm leading-6 text-slate-600">
              A partir de esta visita se define una propuesta más precisa y
              profesional, apoyada en criterio técnico y experiencia de campo.
              La revisión inicial puede tener costo, informado previamente al
              cliente según el tipo de proyecto y desplazamiento requerido.
            </p>
          </div>

          <div
            id="soporte"
            className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <h3 className="font-semibold text-slate-800">
              Soporte y mantenimiento
            </h3>
            <p className="mt-2 text-justify text-sm leading-6 text-slate-600">
              Acompañamiento técnico, revisión de equipos y mejora de
              funcionamiento en sistemas instalados.
            </p>

            <p className="mt-3 text-justify text-sm leading-6 text-slate-600">
              También brindamos soporte técnico orientado directamente a los
              productos, ayudando en validaciones básicas, revisión de
              funcionamiento, configuración inicial, orientación de uso y apoyo
              en incidencias relacionadas con los equipos suministrados.
            </p>

            <p className="mt-3 text-justify text-sm leading-6 text-slate-600">
              Nuestro objetivo es ofrecer una atención clara y útil para que el
              cliente aproveche mejor su solución tecnológica y tenga mayor
              respaldo después de la compra.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-100 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lg">
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

      {/* BLOQUE 3 */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-7 shadow-sm transition duration-300 hover:shadow-md">
          <h2 className="border-l-4 border-[#2D5398] pl-4 text-xl font-bold text-slate-800 md:text-2xl">
            Cómo abordamos una instalación CCTV
          </h2>

          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600 md:text-base">
            <li>• Revisión inicial del lugar y análisis del entorno.</li>
            <li>• Levantamiento de información y toma de medidas.</li>
            <li>• Definición de puntos estratégicos de cobertura.</li>
            <li>• Validación de energía, cableado y condiciones técnicas.</li>
            <li>• Recomendación de equipos acordes al proyecto.</li>
            <li>• Propuesta técnica más clara y útil para la cotización.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-7 shadow-sm transition duration-300 hover:shadow-md">
          <h2 className="border-l-4 border-cyan-600 pl-4 text-xl font-bold text-slate-800 md:text-2xl">
            Qué incluye el soporte técnico sobre productos
          </h2>

          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600 md:text-base">
            <li>• Orientación en uso básico de equipos y accesorios.</li>
            <li>• Acompañamiento en configuraciones iniciales.</li>
            <li>• Revisión de novedades funcionales reportadas.</li>
            <li>• Validación básica de compatibilidades y conexiones.</li>
            <li>• Apoyo técnico inicial sobre productos suministrados.</li>
            <li>• Guía clara para uso, revisión y atención postventa.</li>
          </ul>
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
          href="https://wa.me/573015068866?text=Hola,%20quiero%20más%20información%20sobre%20ADDA%20Seguridad%20S.A.S."
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