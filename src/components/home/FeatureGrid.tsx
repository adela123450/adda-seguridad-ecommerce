import { BiWorld } from "react-icons/bi";
import { FaHammer } from "react-icons/fa6";
import { HiMiniReceiptRefund } from "react-icons/hi2";
import { MdLocalShipping } from "react-icons/md";

export const FeatureGrid = () => {
  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="flex items-center gap-6">
          <MdLocalShipping size={40} className="text-slate-600" />
          <div className="space-y-1">
            <p className="font-semibold">Envío gratis</p>
            <p className="text-sm">En pedidos superiores a $100.000</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <HiMiniReceiptRefund size={40} className="text-slate-600" />
          <div className="space-y-1">
            <p className="font-semibold">Cambios y Devoluciones</p>
            <p className="text-sm">
              Hasta 7 días. Solo para productos sin uso y en su empaque original
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <FaHammer size={40} className="text-slate-600" />
          <div className="space-y-1">
            <p className="font-semibold">Soporte 24/7</p>
            <p className="text-sm">
              Asistencia continua con nuestro equipo de soporte
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <BiWorld size={40} className="text-slate-600" />
          <div className="space-y-1">
            <p className="font-semibold">Garantía de 12 meses</p>
            <p className="text-sm">Aplica por defectos de fábrica</p>
          </div>
        </div>
      </div>
    </section>
  );
};
