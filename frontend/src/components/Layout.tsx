import { BookOpen, CalendarDays, FlaskConical, Home, Languages, Moon, Route, Sun, Trophy, UserRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n";

const nav = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/labs", label: "Labs", icon: FlaskConical },
  { to: "/study-tracks", label: "Tracks", icon: Route },
  { to: "/leaderboard", label: "Leaders", icon: Trophy },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: UserRound }
];

export function Layout() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const [dark, setDark] = useState(() => localStorage.getItem("studentflow_theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("studentflow_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen text-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-left" type="button">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-600/30">
              SF
            </span>
            <span>
              <span className="block text-base font-bold leading-tight">StudentFlow</span>
              <span className="block text-xs leading-tight text-slate-500 dark:text-slate-400">{t("Mini App")}</span>
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button
              aria-label="Change language"
              className="btn-secondary h-10 px-2.5"
              onClick={() => setLanguage(language === "en" ? "uk" : "en")}
              type="button"
            >
              <Languages size={16} />
              {language === "en" ? "UA" : "EN"}
            </button>
            <button aria-label="Toggle dark mode" className="btn-secondary h-10 w-10 p-0" onClick={() => setDark((value) => !value)} type="button">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 sm:pt-6">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200/80 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex min-h-14 min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition ${
                  isActive ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-200" : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                }`
              }
            >
              <Icon size={18} />
              <span>{t(label)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
