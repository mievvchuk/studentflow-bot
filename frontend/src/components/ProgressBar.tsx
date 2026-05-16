export function ProgressBar({ value, tone = "emerald" }: { value: number; tone?: "emerald" | "blue" | "amber" }) {
  const toneClass = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-600",
    amber: "bg-amber-500"
  }[tone];

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
