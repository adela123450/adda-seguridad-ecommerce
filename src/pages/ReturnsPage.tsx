import {
  FiRefreshCcw,
  FiPackage,
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiMessageSquare,
} from "react-icons/fi";

export const ReturnsPage = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      {/* HERO PREMIUM */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] shadow-xl">
        <div className="relative px-6 py-12 md:px-8 md:py-14">
          <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-8 bottom-0 h-32 w-32 rounded-full bg-blue-200/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50">
              Política de devoluciones
            </span>

            <h1 className="mt-4 max-w-4xl text-2xl font-bold text-white md:text-4xl">
              Proceso claro para solicitudes de cambio, revisión o devolución
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100 md:text-lg md:leading-8">
              En ADDA Seguridad S.A.S. buscamos que cada compra tenga respaldo. Si
              se presenta una novedad con el producto, podrás solicitar revisión
              dentro de las condiciones descritas en esta política.
            </p>
          </div>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
            <FiAlertTriangle className="text-2xl" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Productos con defecto
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Si el producto presenta falla de fábrica o novedad atribuible al
            equipo, podremos gestionar revisión y validación del caso.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700">
            <FiClock className="text-2xl" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Solicitud oportuna
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            La notificación debe realizarse dentro del plazo informado y con
            evidencia suficiente para iniciar el proceso.
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700">
            <FiPackage className="text-2xl" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Estado del producto
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            El producto debe conservar condiciones adecuadas, sin señales de mal
            uso, golpes severos o intervención no autorizada.
          </p>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
              <FiRefreshCcw className="text-xl" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
              1. Casos en los que aplica solicitud
            </h2>
          </div>

          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600 md:text-base">
            <li>• Producto recibido con defecto de funcionamiento.</li>
            <li>• Error comprobable en el despacho del pedido.</li>
            <li>• Producto entregado diferente al solicitado.</li>
            <li>• Novedades verificables informadas oportunamente.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-sm transition duration-300 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700">
              <FiClock className="text-xl" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
              2. Tiempo de solicitud
            </h2>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            La novedad debe reportarse en el menor tiempo posible después de la
            entrega. Recomendamos realizar la solicitud dentro de las primeras
            24 a 72 horas, según la naturaleza del caso, adjuntando evidencia
            visual, número de pedido y descripción detallada.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            Los procesos de garantía técnica pueden requerir tiempos adicionales
            de diagnóstico, validación del proveedor o revisión física del
            producto.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
                <FiCheckCircle className="text-xl" />
              </div>

              <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
                3. Condiciones del producto
              </h2>
            </div>

            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600 md:text-base">
              <li>• Debe conservar accesorios y elementos entregados.</li>
              <li>• Debe presentarse en estado razonable de revisión.</li>
              <li>• No debe haber sido modificado o intervenido indebidamente.</li>
              <li>• Debe permitir verificación técnica del inconveniente.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-slate-50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-700">
                <FiAlertTriangle className="text-xl" />
              </div>

              <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
                4. Casos excluidos
              </h2>
            </div>

            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600 md:text-base">
              <li>• Daños por golpes, humedad o mala manipulación.</li>
              <li>• Fallas por instalaciones eléctricas deficientes.</li>
              <li>• Uso indebido o fuera de especificación.</li>
              <li>• Productos alterados por terceros no autorizados.</li>
              <li>• Solicitudes sin evidencia mínima o fuera de plazo razonable.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
            <FiMessageSquare className="text-xl" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
            5. Canal de soporte
          </h2>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
          Para iniciar una solicitud, comunícate con ADDA Seguridad S.A.S. por
          los canales oficiales e incluye la información disponible del caso:
          nombre, número de contacto, producto, fecha de compra, evidencia y
          descripción de la novedad.
        </p>

        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
          Cada caso será evaluado individualmente para determinar si procede
          cambio, revisión técnica, ajuste comercial o respuesta de garantía
          según la situación presentada.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8 rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_55%,#2D5398_100%)] px-8 py-10 text-center text-white shadow-lg">
        <h2 className="text-xl font-bold md:text-3xl">
          ¿Necesitas reportar una novedad con tu producto?
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
          Escríbenos por WhatsApp con la información del caso y te orientaremos
          sobre el proceso de revisión.
        </p>

        <a
          href="https://wa.me/573015068866?text=Hola,%20quiero%20reportar%20una%20novedad%20sobre%20un%20producto%20de%20ADDA%20Seguridad%20S.A.S."
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#234684] transition hover:bg-blue-50"
        >
          Solicitar soporte por WhatsApp
        </a>
      </div>
    </section>
  );
};