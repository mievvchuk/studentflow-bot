import { Link, useParams } from "react-router-dom";

import { labsApi, subjectsApi } from "../api/studentflow";
import { EmptyState } from "../components/EmptyState";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { PageHeader } from "../components/PageHeader";
import { SectionHeader } from "../components/SectionHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { formatDateTime } from "../utils/format";

export default function SubjectDetailsPage() {
  const { id } = useParams();
  const subjectId = Number(id);
  const subject = useAsync(() => subjectsApi.get(subjectId), [subjectId]);
  const labs = useAsync(() => labsApi.list({ subject_id: subjectId }), [subjectId]);

  if (subject.loading) return <LoadingState title="Loading subject" />;
  if (subject.error) return <ErrorState title="Could not load subject" description={subject.error} onRetry={subject.reload} />;
  if (!subject.data) return <EmptyState title="Subject not found" description="This subject may have been deleted." />;

  return (
    <div className="page-stack">
      <section className="surface">
        <div className="mb-3 h-2 rounded-full" style={{ backgroundColor: subject.data.color ?? "#2563eb" }} />
        <PageHeader title={subject.data.title} description={subject.data.description || "No description"} />
      </section>

      <SectionHeader title="Labs" caption="Related work for this subject." />
      {labs.loading ? <LoadingState title="Loading subject labs" /> : null}
      {labs.error ? <ErrorState title="Could not load labs" description={labs.error} onRetry={labs.reload} /> : null}
      <section className="grid gap-3">
        {labs.data?.map((lab) => (
          <Link className="tap-card block" key={lab.id} to={`/labs/${lab.id}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{lab.title}</h3>
                <p className="text-sm text-slate-500">{formatDateTime(lab.deadline)}</p>
              </div>
              <StatusBadge status={lab.status} />
            </div>
          </Link>
        ))}
      </section>
      {!labs.loading && labs.data?.length === 0 ? <EmptyState title="No labs for this subject" description="Create a lab and assign it to this subject." /> : null}
    </div>
  );
}
