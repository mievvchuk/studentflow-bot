import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Edit2, Palette, Plus, Trash2 } from "lucide-react";

import { subjectsApi } from "../api/studentflow";
import { EmptyState } from "../components/EmptyState";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { FormField } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { useAsync } from "../hooks/useAsync";
import { useI18n } from "../i18n";
import type { Subject } from "../types";

const blank = { title: "", description: "", color: "#2563eb" };

export default function SubjectsPage() {
  const { data, loading, reload } = useAsync(subjectsApi.list, []);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Subject | null>(null);
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
      const payload = { ...form, title: form.title.trim(), description: form.description.trim() || null };
      if (editing) {
        await subjectsApi.update(editing.id, payload);
      } else {
        await subjectsApi.create(payload);
      }
      setEditing(null);
      setForm(blank);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  function edit(subject: Subject) {
    setEditing(subject);
    setForm({ title: subject.title, description: subject.description ?? "", color: subject.color ?? "#2563eb" });
  }

  return (
    <div className="page-stack">
      <PageHeader title="Subjects" description="Group labs by course, module, or university subject." />
      <form onSubmit={submit} className="surface grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <FormField label="Title" error={formError}>
          <input className="input" placeholder={t("Algorithms")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </FormField>
        <FormField label="Description">
          <input className="input" placeholder={t("Lab work and lectures")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </FormField>
        <button className="btn-primary self-end" type="submit" disabled={saving}>
          <Plus size={16} /> {editing ? t("Save") : t("Create")}
        </button>
        <FormField label="Color" hint="Used as the subject accent.">
          <div className="flex items-center gap-2">
            <input className="h-10 w-12 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950" type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <span className="helper inline-flex items-center gap-1"><Palette size={13} /> {form.color}</span>
          </div>
        </FormField>
      </form>

      {loading ? <LoadingState title="Loading subjects" /> : null}
      {!loading && !data ? <ErrorState title="Could not load subjects" onRetry={reload} /> : null}
      <section className="grid gap-3 sm:grid-cols-2">
        {data?.map((subject) => (
          <article className="tap-card" key={subject.id}>
            <Link to={`/subjects/${subject.id}`} className="block">
              <div className="mb-3 h-2 rounded-full" style={{ backgroundColor: subject.color ?? "#2563eb" }} />
              <h2 className="font-semibold">{subject.title}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subject.description || t("No description")}</p>
            </Link>
            <div className="mt-4 flex gap-2">
              <button className="btn-secondary h-9 w-9 p-0" aria-label="Edit subject" onClick={() => edit(subject)}>
                <Edit2 size={15} />
              </button>
              <button className="btn-secondary h-9 w-9 p-0" aria-label="Delete subject" onClick={async () => { await subjectsApi.remove(subject.id); await reload(); }}>
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
      </section>
      {!loading && data?.length === 0 ? <EmptyState title="No subjects yet" description="Create your first subject to organize labs and deadlines." /> : null}
    </div>
  );
}
