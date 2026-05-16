import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { TOKEN_KEY } from "../api/client";
import { getMe } from "../api/studentflow";
import { EmptyState } from "../components/EmptyState";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { PageHeader } from "../components/PageHeader";
import { useAsync } from "../hooks/useAsync";
import { useI18n } from "../i18n";

export default function ProfilePage() {
  const navigate = useNavigate();
  const me = useAsync(getMe, []);
  const { t } = useI18n();

  if (me.loading) return <LoadingState title="Loading profile" />;
  if (me.error) return <ErrorState title="Profile is unavailable" description={me.error} onRetry={me.reload} />;
  if (!me.data) return <EmptyState title="Profile is unavailable" description="Sign in from Telegram to load your profile." />;

  return (
    <div className="page-stack">
      <PageHeader title="Profile" description="Telegram account data used by StudentFlow." />
      <section className="surface">
        <div className="flex items-center gap-4">
          {me.data.photo_url ? (
            <img src={me.data.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
              {(me.data.first_name ?? "S").slice(0, 1)}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">{[me.data.first_name, me.data.last_name].filter(Boolean).join(" ") || t("Telegram user")}</h2>
            <p className="text-sm text-slate-500">@{me.data.username ?? "no_username"}</p>
            <p className="text-xs text-slate-400">Telegram ID: {me.data.telegram_id}</p>
          </div>
        </div>
      </section>
      <button
        className="btn-secondary"
        onClick={() => {
          localStorage.removeItem(TOKEN_KEY);
          navigate("/auth", { replace: true });
        }}
      >
        <LogOut size={16} /> {t("Sign out")}
      </button>
    </div>
  );
}
