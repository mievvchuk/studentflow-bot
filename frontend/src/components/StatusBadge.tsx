import type { LabStatus, TechnologyStatus } from "../types";
import { useI18n } from "../i18n";

const styles: Record<string, string> = {
  not_started: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
  submitted: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200"
};

export function StatusBadge({ status }: { status: LabStatus | TechnologyStatus }) {
  const { t } = useI18n();
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>{t(status.replace("_", " "))}</span>;
}
