import { BiWorld } from "react-icons/bi";
import { FaHammer } from "react-icons/fa6";
import { HiMiniReceiptRefund } from "react-icons/hi2";
import { MdLocalShipping } from "react-icons/md";

const features = [
  {
    icon: MdLocalShipping,
    title: "Envío gratis",
    text: "En compras superiores a $300.000",
  },
  {
    icon: HiMiniReceiptRefund,
    title: "Cambios y devoluciones",
    text: "Hasta 7 días para productos sin uso y empaque original.",
  },
  {
    icon: FaHammer,
    title: "Soporte técnico",
    text: "Atención técnica y comercial cuando la necesites.",
  },
  {
    icon: BiWorld,
    title: "Garantía de productos",
    text: "3 meses por defectos de fábrica.",
  },
];

export const FeatureGrid = () => {
  return (
    <section className="border-y border-slate-200 bg-white py-6">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {features.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={index}
                className="flex items-start gap-3 rounded-xl px-2 py-2 transition duration-300 hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Icon size={18} />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    {item.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {item.text}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};