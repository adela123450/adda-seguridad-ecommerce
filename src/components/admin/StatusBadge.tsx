type StatusBadgeProps = {
  label: string;
  tone?: "amber" | "blue" | "green" | "purple" | "dark" | "red" | "slate";
};

const tones = {
  amber: "bg-amber-100 text-amber-700 ring-amber-200",
  blue: "bg-blue-100 text-blue-700 ring-blue-200",
  green: "bg-green-100 text-green-700 ring-green-200",
  purple: "bg-purple-100 text-purple-700 ring-purple-200",
  dark: "bg-slate-900 text-white ring-slate-900",
  red: "bg-red-100 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
};

export const StatusBadge = ({ label, tone = "slate" }: StatusBadgeProps) => {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${tones[tone]}`}
    >
      {label}
    </span>
  );
};