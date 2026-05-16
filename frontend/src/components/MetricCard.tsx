import type { LucideIcon } from "lucide-react";
import { useI18n } from "../i18n";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "blue" | "emerald" | "amber" | "violet";
}

const tones = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"
};

export function MetricCard({ label, value, icon: Icon, tone = "blue" }: MetricCardProps) {
  const { t } = useI18n();
  return (
    <div className="card">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{t(label)}</p>
    </div>
  );
}
