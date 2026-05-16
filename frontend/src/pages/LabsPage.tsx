import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, Plus, Trash2 } from "lucide-react";

import { labsApi, subjectsApi } from "../api/studentflow";
import { EmptyState } from "../components/EmptyState";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { FormField } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { useI18n } from "../i18n";
import type { LabStatus } from "../types";
import { formatDateTime, fromLocalInputValue } from "../utils/format";

const statuses: LabStatus[] = ["not_started", "in_progress", "completed", "submitted"];

export default function LabsPage() {
  const [status, setStatus] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const labs = useAsync(() => labsApi.list({ status: status || undefined, subject_id: subjectId || undefined }), [status, subjectId]);
  const subjects = useAsync(subjectsApi.list, []);
  const [form, setForm] = useState({ title: "", subject_id: "", deadline: "", status: "not_started" as LabStatus });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useI18n();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (form.title.trim().length < 2) {
      setFormError("Use at least 2 characters.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await labsApi.create({
        title: form.title.trim(),
        subject_id: form.subject_id ? Number(form.subject_id) : null,
        deadline: fromLocalInputValue(form.deadline),
        status: form.status
      });
      setForm({ title: "", subject_id: "", deadline: "", status: "not_started" });
      await labs.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader title="Labs" description="Track work status, deadlines, links, tasks, and reminders." />
      <div className="surface grid gap-3 sm:grid-cols-2">
        <FormField label="Status filter">
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">{t("All statuses")}</option>
            {statuses.map((item) => <option key={item} value={item}>{t(item.replace("_", " "))}</option>)}
          </select>
        </FormField>
        <FormField label="Subject filter">
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">{t("All subjects")}</option>
            {subjects.data?.map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}
          </select>
        </FormField>
        <p className="helper flex items-center gap-2 sm:col-span-2"><Filter size={14} /> {t("Filters update the list instantly.")}</p>
      </div>

      <form onSubmit={submit} className="surface grid gap-3 sm:grid-cols-2">
        <FormField label="Title" error={formError}>
          <input className="input" placeholder={t("Lab 3: REST API")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </FormField>
        <FormField label="Subject">
          <select className="input" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
            <option value="">{t("No subject")}</option>
            {subjects.data?.map((subject) => <option key={subject.id} value={subject.id}>{subject.title}</option>)}
          </select>
        </FormField>
        <FormField label="Deadline">
          <input className="input" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </FormField>
        <FormField label="Initial status">
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as LabStatus })}>
            {statuses.map((item) => <option key={item} value={item}>{t(item.replace("_", " "))}</option>)}
          </select>
        </FormField>
        <button className="btn-primary sm:col-span-2" type="submit" disabled={saving}>
          <Plus size={16} /> {t("Create lab")}
        </button>
      </form>

      {labs.loading ? <LoadingState title="Loading labs" /> : null}
      {labs.error ? <ErrorState title="Could not load labs" description={labs.error} onRetry={labs.reload} /> : null}
      <section className="grid gap-3">
        {labs.data?.map((lab) => (
          <article className="tap-card" key={lab.id}>
            <Link to={`/labs/${lab.id}`} className="block">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{lab.title}</h2>
                  <p className="text-sm text-slate-500">{formatDateTime(lab.deadline)}</p>
                </div>
                <StatusBadge status={lab.status} />
              </div>
            </Link>
            <button className="btn-secondary mt-3 h-9 w-9 p-0" aria-label="Delete lab" onClick={async () => { await labsApi.remove(lab.id); await labs.reload(); }}>
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </section>
      {!labs.loading && labs.data?.length === 0 ? <EmptyState title="No labs found" description="Create a lab or adjust the current filters." /> : null}
    </div>
  );
}
