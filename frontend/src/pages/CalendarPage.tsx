import { Link } from "react-router-dom";

import { labsApi } from "../api/studentflow";
import { EmptyState } from "../components/EmptyState";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { useI18n } from "../i18n";
import type { Lab } from "../types";
import { formatDateTime, groupByDate } from "../utils/format";

export default function CalendarPage() {
  const labs = useAsync(() => labsApi.list(), []);
  const { t } = useI18n();
  const groups = groupByDate<Lab>(labs.data ?? []);

  return (
    <div className="page-stack">
      <PageHeader title="Calendar" description="Labs grouped by deadline date for quick mobile scanning." />
      {labs.loading ? <LoadingState title="Loading calendar" /> : null}
      {labs.error ? <ErrorState title="Could not load calendar" description={labs.error} onRetry={labs.reload} /> : null}
      {Object.entries(groups).map(([date, items]) => (
        <section className="space-y-2" key={date}>
          <h2 className="label sticky top-[4.75rem] z-10 rounded-lg bg-white/90 px-2 py-1 backdrop-blur dark:bg-slate-950/90">{t(date)}</h2>
          {items.map((lab) => (
            <Link className="tap-card flex items-center justify-between gap-3" key={lab.id} to={`/labs/${lab.id}`}>
              <div>
                <h3 className="font-semibold">{lab.title}</h3>
                <p className="text-sm text-slate-500">{formatDateTime(lab.deadline)}</p>
              </div>
              <StatusBadge status={lab.status} />
            </Link>
          ))}
        </section>
      ))}
      {!labs.loading && labs.data?.length === 0 ? <EmptyState title="No lab deadlines" description="Labs with deadlines will appear grouped by date." /> : null}
    </div>
  );
}
