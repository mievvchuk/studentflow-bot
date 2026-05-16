import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "../i18n";

interface StateBlockProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function LoadingState({ title = "Loading" }: Partial<StateBlockProps>) {
  const { t } = useI18n();
  return (
    <div className="surface flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
      <Loader2 className="animate-spin text-blue-600" size={18} />
      <span>{t(title)}</span>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: StateBlockProps & { onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="surface border-red-200 bg-red-50/90 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 shrink-0" size={18} />
        <div className="min-w-0">
          <p className="font-semibold">{t(title)}</p>
          {description && <p className="mt-1 text-sm opacity-80">{t(description)}</p>}
        </div>
      </div>
      {onRetry && (
        <button className="btn-secondary mt-3 bg-white/70 dark:bg-red-950/30" onClick={onRetry} type="button">
          <RefreshCw size={15} /> {t("Retry")}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: StateBlockProps) {
  const { t } = useI18n();
  return (
    <div className="surface flex flex-col items-center justify-center px-5 py-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
        <Inbox size={20} />
      </div>
      <p className="font-semibold text-slate-900 dark:text-white">{t(title)}</p>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">{t(description)}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
