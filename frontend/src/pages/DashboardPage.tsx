import { BookOpen, CalendarPlus, CheckCircle2, Clock3, FlaskConical, Route } from "lucide-react";
import { Link } from "react-router-dom";

import { dashboardApi, getMe } from "../api/studentflow";
import { EmptyState } from "../components/EmptyState";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { SectionHeader } from "../components/SectionHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { useI18n } from "../i18n";
import { formatDateTime } from "../utils/format";

export default function DashboardPage() {
  const dashboard = useAsync(dashboardApi.get, []);
  const me = useAsync(getMe, []);
  const { t } = useI18n();

  if (dashboard.loading) return <LoadingState title="Loading dashboard" />;
  if (dashboard.error) return <ErrorState title="Dashboard is unavailable" description={dashboard.error} onRetry={dashboard.reload} />;
  if (!dashboard.data) return <EmptyState title="No dashboard data" description="Create subjects, labs, and study tracks to fill this view." />;

  const stats = [
    { label: "Subjects", value: dashboard.data.total_subjects, icon: BookOpen, tone: "blue" as const },
    { label: "Labs", value: dashboard.data.total_labs, icon: FlaskConical, tone: "amber" as const },
    { label: "Completed", value: dashboard.data.completed_labs, icon: CheckCircle2, tone: "emerald" as const },
    { label: "In progress", value: dashboard.data.labs_in_progress, icon: Clock3, tone: "violet" as const }
  ];

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Today"
        title={`${t("Hi")}, ${me.data?.first_name ?? t("student")}`}
        description="Track labs, deadlines, reminders, and your programming study progress from one mobile workspace."
      />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <MetricCard key={label} label={label} value={value} icon={Icon} tone={tone} />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <SectionHeader
            title="Upcoming deadlines"
            caption="Nearest labs first"
            action={<Link className="text-sm font-semibold text-blue-600 dark:text-blue-300" to="/labs">
              {t("View labs")}
            </Link>}
          />
          {dashboard.data.upcoming_deadlines.length ? (
            dashboard.data.upcoming_deadlines.map((lab) => (
              <Link className="tap-card block" key={lab.id} to={`/labs/${lab.id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{lab.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(lab.deadline)}</p>
                  </div>
                  <StatusBadge status={lab.status} />
                </div>
              </Link>
            ))
          ) : (
            <EmptyState title="No upcoming labs" description="Add a lab with a deadline to see it here." />
          )}
        </div>

        <div className="space-y-3">
          <SectionHeader
            title="Study tracks"
            caption="Programming roadmap progress"
            action={<Link className="text-sm font-semibold text-blue-600 dark:text-blue-300" to="/study-tracks">
              {t("View tracks")}
            </Link>}
          />
          {dashboard.data.study_track_progress.length ? (
            dashboard.data.study_track_progress.map((track) => (
              <Link className="tap-card block space-y-3" key={track.id} to={`/study-tracks/${track.id}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{track.title}</h3>
                  <span className="text-sm text-slate-500">{track.progress}%</span>
                </div>
                <ProgressBar value={track.progress} tone="emerald" />
              </Link>
            ))
          ) : (
            <EmptyState title="No active tracks" description="Create a study track for technologies you want to learn." />
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link className="btn-primary" to="/subjects">
          <BookOpen size={16} /> {t("Subject")}
        </Link>
        <Link className="btn-secondary" to="/calendar">
          <CalendarPlus size={16} /> {t("Calendar")}
        </Link>
        <Link className="btn-secondary" to="/study-tracks">
          <Route size={16} /> {t("Track")}
        </Link>
        <Link className="btn-secondary" to="/labs">
          <FlaskConical size={16} /> {t("Lab")}
        </Link>
      </section>
    </div>
  );
}
