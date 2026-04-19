import {
  FiFileText,
  FiShoppingCart,
  FiClock,
  FiShield,
  FiTruck,
  FiAlertCircle,
} from "react-icons/fi";

export const TermsPage = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:py-12">
      {/* HERO PREMIUM */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#101935] via-[#243C78] to-[#3F61B3] shadow-xl">
        <div className="relative px-6 py-12 md:px-8 md:py-14">
          <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-8 bottom-0 h-32 w-32 rounded-full bg-blue-200/10 blur-3xl" />

          <div className="relative">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-50">
              Términos de servicio
            </span>

            <h1 className="mt-4 max-w-4xl text-2xl font-bold text-white md:text-4xl">
              Condiciones generales para el uso del sitio y la atención comercial
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-blue-100 md:text-lg md:leading-8">
              Estos términos describen las reglas básicas aplicables al uso del
              sitio web, la consulta de productos, la solicitud de cotizaciones
              y los procesos comerciales gestionados por ADDA Seguridad S.A.S.
            </p>
          </div>
        </div>
      </div>

      {/* TARJETAS */}
      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
            <FiShoppingCart className="text-2xl" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Compra informada
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Nuestro objetivo es brindar información clara sobre productos,
            disponibilidad, asesoría y condiciones comerciales.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700">
            <FiShield className="text-2xl" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Relación transparente
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Las condiciones aplican a consultas, pedidos, cotizaciones y
            operaciones realizadas a través de nuestros canales.
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700">
            <FiFileText className="text-2xl" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Uso del sitio
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            El uso del sitio implica aceptación de estas condiciones en lo que
            resulte aplicable a navegación, contacto y compra.
          </p>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
              <FiShoppingCart className="text-xl" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
              1. Condiciones de compra
            </h2>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            Los productos publicados en el sitio tienen finalidad informativa y
            comercial. Algunas compras podrán requerir validación previa,
            confirmación de existencias, revisión de cobertura, verificación de
            datos del cliente o confirmación del medio de pago antes de quedar
            formalizadas.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            ADDA Seguridad S.A.S. se reserva el derecho de aceptar, rechazar o
            reprogramar una solicitud cuando existan errores evidentes en la
            información, inconsistencias en disponibilidad, cambios de precio o
            imposibilidad operativa justificada.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-7 shadow-sm transition duration-300 hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700">
              <FiAlertCircle className="text-xl" />
            </div>

            <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
              2. Disponibilidad y catálogo
            </h2>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            La disponibilidad de productos puede variar sin previo aviso debido
            a rotación de inventario, cambios del proveedor o ajuste del
            portafolio comercial. La publicación de un producto no garantiza su
            disponibilidad inmediata.
          </p>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
            En caso de agotado, el cliente podrá recibir propuesta equivalente,
            reprogramación, actualización de cotización o información para una
            nueva fecha estimada de entrega.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-blue-50 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
          <FiFileText className="text-2xl text-[#2D5398]" />

          <h2 className="mt-4 text-lg font-bold text-slate-800 md:text-xl">
            3. Precios referenciales
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
            Los precios publicados pueden ser referenciales y estar sujetos a
            cambios por variación del mercado, tasa de cambio, disponibilidad,
            promociones vigentes o condiciones específicas del proyecto.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-cyan-50 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
          <FiShield className="text-2xl text-cyan-700" />

          <h2 className="mt-4 text-lg font-bold text-slate-800 md:text-xl">
            4. Garantías
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
            Las garantías aplican de acuerdo con la naturaleza del producto, las
            condiciones informadas al cliente y la validación técnica del caso.
            No cubren daños por mala instalación, manipulación indebida,
            golpes, humedad, sobrecargas eléctricas o uso no recomendado.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50 p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
          <FiClock className="text-2xl text-indigo-700" />

          <h2 className="mt-4 text-lg font-bold text-slate-800 md:text-xl">
            5. Tiempos de entrega
          </h2>

          <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base">
            Los tiempos de entrega son estimados y pueden variar según
            inventario, ubicación, transportadora, validación del pedido o
            condiciones logísticas externas. Siempre se informará al cliente lo
            más oportunamente posible.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2D5398]/10 text-[#2D5398]">
            <FiTruck className="text-xl" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 md:text-2xl">
            6. Uso adecuado del sitio
          </h2>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
          El usuario se compromete a utilizar el sitio web de manera lícita,
          respetuosa y sin afectar su funcionamiento. No está permitido usar el
          contenido del sitio con fines fraudulentos, engañosos o que vulneren
          derechos de terceros o de la marca.
        </p>

        <p className="mt-4 text-sm leading-7 text-slate-600 md:text-base md:leading-8">
          ADDA Seguridad S.A.S. podrá actualizar contenidos, portafolio,
          diseños, condiciones y funcionalidades del sitio cuando lo considere
          necesario para mejorar la experiencia o ajustar la operación
          comercial.
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8 rounded-3xl bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_55%,#2D5398_100%)] px-8 py-10 text-center text-white shadow-lg">
        <h2 className="text-xl font-bold md:text-3xl">
          ¿Deseas validar disponibilidad o condiciones de compra?
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
          Podemos ayudarte a revisar producto, precio, tiempos estimados y
          detalles comerciales antes de tu compra.
        </p>

        <a
          href="https://wa.me/573015068866?text=Hola,%20quiero%20más%20información%20sobre%20los%20términos%20de%20servicio%20de%20ADDA%20Seguridad%20S.A.S."
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#234684] transition hover:bg-blue-50"
        >
          Consultar por WhatsApp
        </a>
      </div>
    </section>
  );
};