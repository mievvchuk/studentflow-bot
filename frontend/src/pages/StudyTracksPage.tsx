import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

import { tracksApi } from "../api/studentflow";
import { EmptyState } from "../components/EmptyState";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { FormField } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { useAsync } from "../hooks/useAsync";
import { useI18n } from "../i18n";

export default function StudyTracksPage() {
  const tracks = useAsync(tracksApi.list, []);
  const [form, setForm] = useState({ title: "", description: "" });
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
      await tracksApi.create({ title: form.title.trim(), description: form.description.trim() || null, progress: 0 });
      setForm({ title: "", description: "" });
      await tracks.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader title="Study tracks" description="Plan technologies and learning tasks across your programming path." />
      <form onSubmit={submit} className="surface grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <FormField label="Title" error={formError}>
          <input className="input" placeholder={t("Backend roadmap")} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </FormField>
        <FormField label="Description">
          <input className="input" placeholder={t("FastAPI, SQL, testing")} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </FormField>
        <button className="btn-primary self-end" type="submit" disabled={saving}><Plus size={16} /> {t("Create")}</button>
      </form>

      {tracks.loading ? <LoadingState title="Loading study tracks" /> : null}
      {tracks.error ? <ErrorState title="Could not load study tracks" description={tracks.error} onRetry={tracks.reload} /> : null}
      <section className="grid gap-3 sm:grid-cols-2">
        {tracks.data?.map((track) => (
          <article className="tap-card space-y-3" key={track.id}>
            <Link to={`/study-tracks/${track.id}`} className="block">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{track.title}</h2>
                <span className="text-sm text-slate-500">{track.progress}%</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{track.description || t("No description")}</p>
            </Link>
            <ProgressBar value={track.progress} tone="emerald" />
            <button className="btn-secondary h-9 w-9 p-0" aria-label="Delete track" onClick={async () => { await tracksApi.remove(track.id); await tracks.reload(); }}>
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </section>
      {!tracks.loading && tracks.data?.length === 0 ? <EmptyState title="No study tracks yet" description="Create a roadmap for technologies you are learning." /> : null}
    </div>
  );
}
