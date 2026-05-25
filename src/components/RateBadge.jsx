export default function RateBadge({ rate }) {
  const color = rate >= 80
    ? "bg-green-50 text-green-700 border-green-200"
    : rate >= 60
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-red-50 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${color}`}>
      {rate}%
    </span>
  );
}
