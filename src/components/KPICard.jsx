export default function KPICard({ title, value, subtitle, icon: Icon, color = "blue" }) {
  const colorMap = {
    blue:   { bg: "bg-blue-50",   icon: "text-blue-500",   border: "border-blue-100" },
    green:  { bg: "bg-green-50",  icon: "text-green-500",  border: "border-green-100" },
    red:    { bg: "bg-red-50",    icon: "text-red-500",    border: "border-red-100" },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-500",  border: "border-amber-100" },
    purple: { bg: "bg-purple-50", icon: "text-purple-500", border: "border-purple-100" },
    slate:  { bg: "bg-slate-50",  icon: "text-slate-400",  border: "border-slate-200" },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`bg-white rounded-xl border ${c.border} shadow-sm p-5 flex items-start gap-4`}>
      {Icon && (
        <div className={`${c.bg} rounded-lg p-2.5 mt-0.5 shrink-0`}>
          <Icon size={20} className={c.icon} />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5 leading-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
