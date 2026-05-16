import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { TOKEN_KEY } from "../api/client";
import { telegramAuth } from "../api/studentflow";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { useI18n } from "../i18n";

function getTelegramLaunchInitData() {
  const webAppInitData = window.Telegram?.WebApp?.initData;
  if (webAppInitData) {
    return webAppInitData;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  return hashParams.get("tgWebAppData") ?? queryParams.get("tgWebAppData") ?? "";
}

export default function TelegramAuthPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function authenticate() {
      const webApp = window.Telegram?.WebApp;
      webApp?.ready();
      webApp?.expand();
      if (webApp?.colorScheme === "dark") {
        document.documentElement.classList.add("dark");
      }

      const initData = getTelegramLaunchInitData();
      if (!initData) {
        setError("Telegram did not provide initData. Open the app from the bot's Mini App button, not from a pasted link.");
        return;
      }

      try {
        const result = await telegramAuth(initData);
        localStorage.setItem(TOKEN_KEY, result.access_token);
        navigate("/dashboard", { replace: true });
      } catch (authError) {
        if (axios.isAxiosError(authError)) {
          const detail = authError.response?.data?.detail;
          const status = authError.response?.status;
          if (typeof detail === "string") {
            setError(detail);
            return;
          }
          setError(status ? `Backend auth request failed with HTTP ${status}.` : "Backend auth request failed. Check VITE_API_URL and CORS.");
          return;
        }
        setError("Telegram authentication failed. Check BOT_TOKEN and Mini App settings.");
      }
    }

    void authenticate();
  }, [navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-slate-950 dark:text-white">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white/95 p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold text-white shadow-sm shadow-blue-600/30">
          SF
        </div>
        <h1 className="text-2xl font-bold">StudentFlow Bot</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("Telegram-only access for labs, tracks, and reminders.")}</p>
        <div className="mt-5">
          {error ? <ErrorState title={t("Authentication failed")} description={t(error)} /> : <LoadingState title={t("Signing in with Telegram")} />}
        </div>
      </section>
    </main>
  );
}
