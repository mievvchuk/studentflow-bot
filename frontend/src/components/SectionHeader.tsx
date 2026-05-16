import type { ReactNode } from "react";
import { useI18n } from "../i18n";

interface SectionHeaderProps {
  title: string;
  caption?: string;
  action?: ReactNode;
}

export function SectionHeader({ title, caption, action }: SectionHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">{t(title)}</h2>
        {caption && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{t(caption)}</p>}
      </div>
      {action}
    </div>
  );
}
