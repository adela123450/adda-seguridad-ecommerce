type MetricCardProps = {
  title: string;
  value: string | number;
  description: string;
  tone?: "blue" | "green" | "purple" | "red";
};

const tones = {
  blue: "border-blue-200 text-[#2D5398] shadow-blue-100/70",
  green: "border-green-200 text-green-700 shadow-green-100/70",
  purple: "border-purple-200 text-purple-700 shadow-purple-100/70",
  red: "border-red-200 text-red-700 shadow-red-100/70",
};

export const MetricCard = ({
  title,
  value,
  description,
  tone = "blue",
}: MetricCardProps) => {
  return (
    <article
      className={`rounded-3xl border bg-white p-6 shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl ${tones[tone]}`}
    >
      <p className="text-sm font-semibold text-slate-500">{title}</p>

      <h2 className="mt-3 text-3xl font-black tracking-tight">{value}</h2>

      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </article>
  );
};