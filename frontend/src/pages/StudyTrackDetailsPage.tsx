import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";

import { tracksApi } from "../api/studentflow";
import { EmptyState } from "../components/EmptyState";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { FormField } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { SectionHeader } from "../components/SectionHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { useI18n } from "../i18n";
import type { TechnologyStatus } from "../types";

const statuses: TechnologyStatus[] = ["not_started", "in_progress", "completed"];

export default function StudyTrackDetailsPage() {
  const { id } = useParams();
  const trackId = Number(id);
  const track = useAsync(() => tracksApi.get(trackId), [trackId]);
  const technologies = useAsync(() => tracksApi.technologies(trackId), [trackId]);
  const [technologyTitle, setTechnologyTitle] = useState("");
  const [taskByTech, setTaskByTech] = useState<Record<number, string>>({});
  const [tasksByTech, setTasksByTech] = useState<Record<number, Awaited<ReturnType<typeof tracksApi.tasks>>>>({});
  const { t } = useI18n();

  async function refreshTasks(technologyId: number) {
    setTasksByTech((current) => ({ ...current, [technologyId]: [] }));
    const tasks = await tracksApi.tasks(technologyId);
    setTasksByTech((current) => ({ ...current, [technologyId]: tasks }));
  }

  async function addTechnology(event: FormEvent) {
    event.preventDefault();
    await tracksApi.createTechnology(trackId, { title: technologyTitle, progress: 0, status: "not_started" });
    setTechnologyTitle("");
    await technologies.reload();
  }

  if (track.loading) return <LoadingState title="Loading study track" />;
  if (track.error) return <ErrorState title="Could not load study track" description={track.error} onRetry={track.reload} />;
  if (!track.data) return <EmptyState title="Study track not found" description="This track may have been deleted." />;

  return (
    <div className="page-stack">
      <PageHeader title={track.data.title} description={track.data.description || "No description"} />
      <section className="surface">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Overall progress</h2>
          <span className="text-sm text-slate-500">{track.data.progress}%</span>
        </div>
        <div className="mt-4">
          <ProgressBar value={track.data.progress} />
        </div>
        <FormField label="Edit progress" hint="0 to 100 percent">
          <input
            className="input mt-2"
            type="number"
            min={0}
            max={100}
            value={track.data.progress}
            onChange={async (event) => {
              await tracksApi.update(trackId, { progress: Number(event.target.value) });
              await track.reload();
            }}
          />
        </FormField>
      </section>

      <form onSubmit={addTechnology} className="surface flex gap-2">
        <input className="input" placeholder={t("Technology title")} value={technologyTitle} onChange={(event) => setTechnologyTitle(event.target.value)} required />
        <button className="btn-primary h-10 w-10 shrink-0 p-0" aria-label="Add technology"><Plus size={17} /></button>
      </form>

      <section className="space-y-3">
        <SectionHeader title="Technologies" caption="Progress and learning tasks inside this track." />
        {technologies.loading ? <LoadingState title="Loading technologies" /> : null}
        {technologies.error ? <ErrorState title="Could not load technologies" description={technologies.error} onRetry={technologies.reload} /> : null}
        {technologies.data?.map((technology) => (
          <article className="tap-card space-y-3" key={technology.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{technology.title}</h2>
                <p className="text-sm text-slate-500">{technology.progress}% {t("complete")}</p>
              </div>
              <StatusBadge status={technology.status} />
            </div>
            <ProgressBar value={technology.progress} tone={technology.status === "completed" ? "emerald" : "blue"} />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className="input"
                value={technology.status}
                onChange={async (event) => {
                  await tracksApi.updateTechnology(technology.id, { status: event.target.value as TechnologyStatus });
                  await technologies.reload();
                }}
              >
                {statuses.map((status) => <option key={status} value={status}>{t(status.replace("_", " "))}</option>)}
              </select>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                value={technology.progress}
                onChange={async (event) => {
                  await tracksApi.updateTechnology(technology.id, { progress: Number(event.target.value) });
                  await technologies.reload();
                }}
              />
            </div>
            <button className="text-sm font-medium text-blue-600" onClick={() => refreshTasks(technology.id)} type="button">
              {t("Load tasks")}
            </button>
            {(tasksByTech[technology.id] ?? []).map((task) => (
              <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-950" key={task.id}>
                <input
                  type="checkbox"
                  checked={task.is_completed}
                  onChange={async (event) => {
                    await tracksApi.updateTask(task.id, { is_completed: event.target.checked });
                    await refreshTasks(technology.id);
                  }}
                />
                <span className={task.is_completed ? "text-slate-400 line-through" : ""}>{task.title}</span>
              </label>
            ))}
            <form
              className="flex gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                await tracksApi.createTask(technology.id, { title: taskByTech[technology.id] ?? "" });
                setTaskByTech((current) => ({ ...current, [technology.id]: "" }));
                await refreshTasks(technology.id);
              }}
            >
              <input
                className="input"
                placeholder={t("Learning task")}
                value={taskByTech[technology.id] ?? ""}
                onChange={(event) => setTaskByTech((current) => ({ ...current, [technology.id]: event.target.value }))}
                required
              />
              <button className="btn-primary h-10 w-10 shrink-0 p-0" aria-label="Add learning task"><Plus size={17} /></button>
            </form>
            <button className="btn-secondary h-9 w-9 p-0" aria-label="Delete technology" onClick={async () => { await tracksApi.removeTechnology(technology.id); await technologies.reload(); }}>
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </section>
      {!technologies.loading && !technologies.data?.length ? <EmptyState title="No technologies in this track" /> : null}
    </div>
  );
}
