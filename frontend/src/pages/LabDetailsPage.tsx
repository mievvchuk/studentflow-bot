import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";
import { GitBranch, Plus, Trash2 } from "lucide-react";

import { labsApi, remindersApi } from "../api/studentflow";
import { EmptyState } from "../components/EmptyState";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { FormField } from "../components/FormField";
import { PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { SectionHeader } from "../components/SectionHeader";
import { StatusBadge } from "../components/StatusBadge";
import { useAsync } from "../hooks/useAsync";
import { useI18n } from "../i18n";
import type { LabStatus } from "../types";
import { formatDateTime, fromLocalInputValue } from "../utils/format";

const statuses: LabStatus[] = ["not_started", "in_progress", "completed", "submitted"];

export default function LabDetailsPage() {
  const { id } = useParams();
  const labId = Number(id);
  const lab = useAsync(() => labsApi.get(labId), [labId]);
  const tasks = useAsync(() => labsApi.tasks(labId), [labId]);
  const reminders = useAsync(remindersApi.list, []);
  const [taskTitle, setTaskTitle] = useState("");
  const [reminder, setReminder] = useState({ remind_at: "", message: "" });
  const { t } = useI18n();
  const completedTasks = tasks.data?.filter((task) => task.is_completed).length ?? 0;
  const taskProgress = tasks.data?.length ? Math.round((completedTasks / tasks.data.length) * 100) : 0;

  async function updateStatus(status: LabStatus) {
    await labsApi.update(labId, { status });
    await lab.reload();
  }

  async function addTask(event: FormEvent) {
    event.preventDefault();
    await labsApi.createTask(labId, { title: taskTitle });
    setTaskTitle("");
    await tasks.reload();
  }

  async function addReminder(event: FormEvent) {
    event.preventDefault();
    await remindersApi.create({
      lab_id: labId,
      remind_at: fromLocalInputValue(reminder.remind_at) ?? undefined,
      message: reminder.message
    });
    setReminder({ remind_at: "", message: "" });
    await reminders.reload();
  }

  if (lab.loading) return <LoadingState title="Loading lab" />;
  if (lab.error) return <ErrorState title="Could not load lab" description={lab.error} onRetry={lab.reload} />;
  if (!lab.data) return <EmptyState title="Lab not found" description="This lab may have been deleted." />;

  const labReminders = reminders.data?.filter((item) => item.lab_id === labId) ?? [];

  return (
    <div className="page-stack">
      <PageHeader title={lab.data.title} description={formatDateTime(lab.data.deadline)} action={<StatusBadge status={lab.data.status} />} />
      <section className="surface">
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{lab.data.description || t("No description")}</p>
        {lab.data.github_url && (
          <a className="btn-secondary mt-4" href={lab.data.github_url} target="_blank" rel="noreferrer">
            <GitBranch size={16} /> GitHub
          </a>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeader title="Status" caption="Move the lab through your workflow." />
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button key={status} className={lab.data?.status === status ? "btn-primary" : "btn-secondary"} onClick={() => updateStatus(status)}>
              {t(status.replace("_", " "))}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Tasks checklist" caption={`${completedTasks} ${t("of")} ${tasks.data?.length ?? 0} ${t("completed")}`} />
        <ProgressBar value={taskProgress} tone="blue" />
        <form onSubmit={addTask} className="flex gap-2">
          <input className="input" placeholder={t("New task")} value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} required />
          <button className="btn-primary h-10 w-10 shrink-0 p-0" aria-label="Add task">
            <Plus size={17} />
          </button>
        </form>
        {tasks.data?.map((task) => (
          <label key={task.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <input
              type="checkbox"
              checked={task.is_completed}
              onChange={async (event) => {
                await labsApi.updateTask(task.id, { is_completed: event.target.checked });
                await tasks.reload();
              }}
            />
            <span className={task.is_completed ? "text-slate-400 line-through" : ""}>{task.title}</span>
            <button
              className="ml-auto text-slate-400"
              type="button"
              aria-label="Delete task"
              onClick={async () => {
                await labsApi.removeTask(task.id);
                await tasks.reload();
              }}
            >
              <Trash2 size={15} />
            </button>
          </label>
        ))}
        {!tasks.loading && tasks.data?.length === 0 ? <EmptyState title="No checklist tasks" description="Add small steps to make the lab easier to finish." /> : null}
      </section>

      <section className="space-y-3">
        <SectionHeader title="Reminder settings" caption="Telegram reminders are sent once." />
        <form onSubmit={addReminder} className="surface grid gap-3 sm:grid-cols-2">
          <FormField label="When">
            <input className="input" type="datetime-local" value={reminder.remind_at} onChange={(event) => setReminder({ ...reminder, remind_at: event.target.value })} required />
          </FormField>
          <FormField label="Message">
            <input className="input" placeholder={t("Submit lab report")} value={reminder.message} onChange={(event) => setReminder({ ...reminder, message: event.target.value })} required />
          </FormField>
          <button className="btn-primary sm:col-span-2" type="submit">{t("Create reminder")}</button>
        </form>
        {labReminders.map((item) => (
          <div className="card flex items-center justify-between gap-3" key={item.id}>
            <div>
              <p className="font-medium">{item.message}</p>
              <p className="text-sm text-slate-500">{formatDateTime(item.remind_at)} {item.is_sent ? t("sent") : t("pending")}</p>
            </div>
            <button className="btn-secondary h-9 w-9 p-0" aria-label="Delete reminder" onClick={async () => { await remindersApi.remove(item.id); await reminders.reload(); }}>
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
