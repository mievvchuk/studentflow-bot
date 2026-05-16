import type { ReactNode } from "react";
import { useI18n } from "../i18n";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  const { t } = useI18n();
  return (
    <section className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="label mb-1">{t(eyebrow)}</p>}
        <h1 className="text-2xl font-bold tracking-normal text-slate-950 dark:text-white">{t(title)}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{t(description)}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </section>
  );
}
