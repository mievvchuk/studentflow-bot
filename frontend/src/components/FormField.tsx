import type { ReactNode } from "react";
import { useI18n } from "../i18n";

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, error, hint, children }: FormFieldProps) {
  const { t } = useI18n();
  return (
    <label className="block space-y-1.5">
      <span className="label">{t(label)}</span>
      {children}
      {error ? <span className="text-xs font-medium text-red-600 dark:text-red-300">{t(error)}</span> : null}
      {!error && hint ? <span className="helper">{t(hint)}</span> : null}
    </label>
  );
}
