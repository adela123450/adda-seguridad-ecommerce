import {
  FiShield,
  FiFileText,
  FiMessageCircle,
  FiLock,
  FiInfo,
} from "react-icons/fi";

export const PrivacyPage = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      {/* HERO PREMIUM */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] shadow-xl">
        <div className="relative px-6 py-12 md:px-8 md:py-14">
          <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-8 bottom-0 h-32 w-32 rounded-full bg-blue-200/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50">
              Política de privacidad
            </span>

            <h1 className="mt-4 max-w-4xl text-2xl font-bold text-white md:text-4xl">
              Tratamos tu información con responsabilidad y transparencia
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100 md:text-lg md:leading-8">
              En ADDA Seguridad S.A.S. valoramos la confianza de nuestros
              clientes. Esta política explica cómo recopilamos, usamos y
              protegemos los datos personales que compartes con nosotros a través
              del sitio web, formularios, canales de atención y comunicación
              comercial.
            </p>
          </div>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
            <FiShield className="text-2xl" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Protección de datos
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Aplicamos medidas razonables para proteger la información que nos
            compartes durante consultas, solicitudes y procesos comerciales.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700">
            <FiFileText className="text-2xl" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Uso responsable
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            La información se utiliza para atención comercial, contacto,
            cotizaciones, seguimiento de pedidos y mejora de la experiencia en
            nuestros canales.
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700">
            <FiLock className="text-2xl" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Confidencialidad
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            No compartimos datos personales con terceros ajenos a la operación
            comercial, salvo obligación legal o necesidad operativa justificada.
          </p>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:shadow-md">
          <h2 className="border-l-4 border-[#2D5398] pl-4 text-xl font-bold text-slate-800 md:text-2xl">
            1. Información que podemos recopilar
          </h2>

          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600 md:text-base">
            <li>• Nombre y datos de contacto.</li>
            <li>• Ciudad, dirección y datos necesarios para despacho.</li>
            <li>• Información compartida en formularios o WhatsApp.</li>
            <li>• Datos relacionados con solicitudes de cotización o soporte.</li>
            <li>• Información técnica básica de navegación y uso del sitio.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-sm transition duration-300 hover:shadow-md">
          <h2 className="border-l-4 border-cyan-600 pl-4 text-xl font-bold text-slate-800 md:text-2xl">
            2. Finalidad del tratamiento
          </h2>

          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600 md:text-base">
            <li>• Responder consultas y solicitudes comerciales.</li>
            <li>• Elaborar cotizaciones y gestionar ventas.</li>
            <li>• Coordinar entregas, instalaciones o soporte técnico.</li>
            <li>• Enviar información relevante sobre productos o servicios.</li>
            <li>• Mejorar la experiencia del usuario en el sitio web.</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
                <FiMessageCircle className="text-xl" />
              </div>

              <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
                3. Uso de formularios y WhatsApp
              </h2>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
              Cuando diligencias formularios o nos contactas por WhatsApp,
              utilizamos los datos suministrados únicamente para atender tu
              solicitud, brindar información comercial, realizar seguimiento a
              tu requerimiento o coordinar una posible compra, visita técnica o
              soporte.
            </p>

            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
              Recomendamos no enviar información sensible innecesaria por medios
              digitales. ADDA Seguridad S.A.S. dará tratamiento responsable a la
              información recibida dentro del alcance de la relación comercial.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700">
                <FiInfo className="text-xl" />
              </div>

              <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
                4. Cookies y navegación
              </h2>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
              Este sitio puede utilizar cookies o tecnologías similares para
              mejorar la navegación, recordar preferencias básicas, analizar el
              comportamiento general del sitio y optimizar la experiencia del
              usuario.
            </p>

            <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
              El usuario puede gestionar cookies desde la configuración de su
              navegador. La desactivación de algunas funcionalidades puede
              afectar parcialmente la experiencia de uso.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-7 shadow-sm">
        <h2 className="border-l-4 border-[#2D5398] pl-4 text-xl font-bold text-slate-800 md:text-2xl">
          5. Derechos del titular
        </h2>

        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
          Como titular de los datos, puedes solicitar consulta, actualización,
          corrección o eliminación de tu información personal, así como revocar
          autorizaciones cuando sea legalmente procedente. Para ello, puedes
          comunicarte con ADDA Seguridad S.A.S. a través de los canales
          oficiales de contacto publicados en el sitio.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8 rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_55%,#2D5398_100%)] px-8 py-10 text-center text-white shadow-lg">
        <h2 className="text-xl font-bold md:text-3xl">
          ¿Necesitas aclarar algo sobre el tratamiento de tus datos?
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
          Puedes comunicarte con nosotros para ampliar información sobre
          privacidad, contacto comercial o atención de solicitudes.
        </p>

        <a
          href="https://wa.me/573015068866?text=Hola,%20quiero%20información%20sobre%20la%20política%20de%20privacidad%20de%20ADDA%20Seguridad%20S.A.S."
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#234684] transition hover:bg-blue-50"
        >
          Contactar por WhatsApp
        </a>
      </div>
    </section>
  );
};