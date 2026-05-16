import { FormEvent, useEffect, useMemo, useState } from "react";
import { Medal, Plus, ShieldCheck, Sparkles, Trophy, UserPlus } from "lucide-react";

import { groupsApi, institutionsApi, leaderboardApi } from "../api/studentflow";
import { EmptyState } from "../components/EmptyState";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { FormField } from "../components/FormField";
import { MetricCard } from "../components/MetricCard";
import { PageHeader } from "../components/PageHeader";
import { SectionHeader } from "../components/SectionHeader";
import { useAsync } from "../hooks/useAsync";
import { useI18n } from "../i18n";
import type { LeaderboardEntry } from "../types";

function displayName(entry: LeaderboardEntry) {
  return entry.user.first_name || entry.user.username || `Student ${entry.user.id}`;
}

function initials(entry: LeaderboardEntry) {
  return displayName(entry).slice(0, 2).toUpperCase();
}

function PodiumCard({ entry, position }: { entry: LeaderboardEntry; position: number }) {
  const styles = [
    "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
    "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
    "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30"
  ];

  return (
    <article className={`rounded-lg border p-4 text-center shadow-sm ${styles[position - 1] ?? styles[1]}`}>
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
        {entry.user.photo_url ? <img src={entry.user.photo_url} alt="" className="h-12 w-12 rounded-full object-cover" /> : initials(entry)}
      </div>
      <div className="mb-1 flex items-center justify-center gap-1 text-sm font-semibold">
        <Medal size={15} /> #{entry.rank}
      </div>
      <h3 className="truncate font-semibold">{displayName(entry)}</h3>
      <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">{entry.points}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">points</p>
    </article>
  );
}

export default function LeaderboardPage() {
  const { t } = useI18n();
  const institutions = useAsync(institutionsApi.list, []);
  const groups = useAsync(groupsApi.list, []);
  const [selectedGroup, setSelectedGroup] = useState("");
  const leaderboard = useAsync(
    () => leaderboardApi.get(selectedGroup ? Number(selectedGroup) : undefined),
    [selectedGroup]
  );
  const [newInstitution, setNewInstitution] = useState({ title: "", type: "university", city: "", country: "" });
  const [institutionInviteCode, setInstitutionInviteCode] = useState("");
  const [newGroup, setNewGroup] = useState({ title: "", description: "", institution_id: "" });
  const [inviteCode, setInviteCode] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedGroup && groups.data?.length) {
      setSelectedGroup(String(groups.data[0].id));
    }
  }, [groups.data, selectedGroup]);

  const weekRange = useMemo(() => {
    if (!leaderboard.data) return "";
    const start = new Date(leaderboard.data.week_start).toLocaleDateString();
    const end = new Date(leaderboard.data.week_end).toLocaleDateString();
    return `${start} - ${end}`;
  }, [leaderboard.data]);

  async function createGroup(event: FormEvent) {
    event.preventDefault();
    if (newGroup.title.trim().length < 2) {
      setFormError("Use at least 2 characters.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const group = await groupsApi.create({
        title: newGroup.title.trim(),
        description: newGroup.description.trim() || null,
        institution_id: newGroup.institution_id ? Number(newGroup.institution_id) : null
      });
      setNewGroup({ title: "", description: "", institution_id: "" });
      setSelectedGroup(String(group.id));
      await groups.reload();
      await leaderboard.reload();
    } finally {
      setSaving(false);
    }
  }

  async function createInstitution(event: FormEvent) {
    event.preventDefault();
    if (newInstitution.title.trim().length < 2) {
      setFormError("Use at least 2 characters.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await institutionsApi.create({
        title: newInstitution.title.trim(),
        type: newInstitution.type,
        city: newInstitution.city.trim() || null,
        country: newInstitution.country.trim() || null
      });
      setNewInstitution({ title: "", type: "university", city: "", country: "" });
      await institutions.reload();
    } finally {
      setSaving(false);
    }
  }

  async function joinInstitution(event: FormEvent) {
    event.preventDefault();
    if (!institutionInviteCode.trim()) {
      setFormError("Enter an invite code.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await institutionsApi.join(institutionInviteCode.trim());
      setInstitutionInviteCode("");
      await institutions.reload();
    } finally {
      setSaving(false);
    }
  }

  async function joinGroup(event: FormEvent) {
    event.preventDefault();
    if (!inviteCode.trim()) {
      setFormError("Enter an invite code.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const group = await groupsApi.join(inviteCode.trim());
      setInviteCode("");
      setSelectedGroup(String(group.id));
      await groups.reload();
      await leaderboard.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Gamification"
        title="Weekly leaderboard"
        description="Compete with your student group using labs, learning tasks, streaks, and weekly points."
      />

      <section className="surface grid gap-3 sm:grid-cols-2">
        <FormField label="Current group" hint={leaderboard.data ? `Invite code: ${leaderboard.data.group.invite_code}` : undefined}>
          <select className="input" value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)}>
          <option value="">{t("Auto-select group")}</option>
            {groups.data?.map((group) => (
              <option key={group.id} value={group.id}>
                {group.title}
              </option>
            ))}
          </select>
        </FormField>
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
          <p className="label">{t("Scoring")}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t("+10 on-time lab, +3 late lab, +2 learning task, +5 weekly streak.")}</p>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <form onSubmit={createInstitution} className="surface grid gap-3">
          <SectionHeader title="Create institution" caption="Add a school, college, or university for your teams." />
          <FormField label="Institution name" error={formError && newInstitution.title.length < 2 ? formError : undefined}>
            <input className="input" placeholder={t("Kyiv Polytechnic Institute")} value={newInstitution.title} onChange={(event) => setNewInstitution({ ...newInstitution, title: event.target.value })} />
          </FormField>
          <FormField label="Institution type">
            <select className="input" value={newInstitution.type} onChange={(event) => setNewInstitution({ ...newInstitution, type: event.target.value })}>
              <option value="school">{t("school")}</option>
              <option value="college">{t("college")}</option>
              <option value="university">{t("university")}</option>
            </select>
          </FormField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="City">
              <input className="input" placeholder={t("Kyiv")} value={newInstitution.city} onChange={(event) => setNewInstitution({ ...newInstitution, city: event.target.value })} />
            </FormField>
            <FormField label="Country">
              <input className="input" placeholder={t("Ukraine")} value={newInstitution.country} onChange={(event) => setNewInstitution({ ...newInstitution, country: event.target.value })} />
            </FormField>
          </div>
          <button className="btn-primary" disabled={saving} type="submit">
            <Plus size={16} /> {t("Create institution")}
          </button>
        </form>

        <form onSubmit={joinInstitution} className="surface grid gap-3">
          <SectionHeader title="Join institution" caption="Use an institution invite code from your teacher or admin." />
          <FormField label="Institution invite code" error={formError && !institutionInviteCode.trim() ? formError : undefined}>
            <input className="input uppercase" placeholder="UNI123456" value={institutionInviteCode} onChange={(event) => setInstitutionInviteCode(event.target.value.toUpperCase())} />
          </FormField>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-950">
            <p className="label">{t("My institutions")}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {institutions.data?.length ? institutions.data.map((item) => `${item.title} (${item.invite_code})`).join(", ") : t("No institutions yet")}
            </p>
          </div>
          <button className="btn-secondary" disabled={saving} type="submit">
            <UserPlus size={16} /> {t("Join institution")}
          </button>
        </form>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <form onSubmit={createGroup} className="surface grid gap-3">
          <SectionHeader title="Create team" caption="Start a leaderboard and share its invite code." />
          <FormField label="Team name" error={formError && newGroup.title.length < 2 ? formError : undefined}>
            <input className="input" placeholder={t("CS-23 Backend Team")} value={newGroup.title} onChange={(event) => setNewGroup({ ...newGroup, title: event.target.value })} />
          </FormField>
          <FormField label="Description">
            <input className="input" placeholder={t("Optional")} value={newGroup.description} onChange={(event) => setNewGroup({ ...newGroup, description: event.target.value })} />
          </FormField>
          <FormField label="Institution">
            <select className="input" value={newGroup.institution_id} onChange={(event) => setNewGroup({ ...newGroup, institution_id: event.target.value })}>
              <option value="">{t("No institution")}</option>
              {institutions.data?.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.title}
                </option>
              ))}
            </select>
          </FormField>
          <button className="btn-primary" disabled={saving} type="submit">
            <Plus size={16} /> {t("Create group")}
          </button>
        </form>

        <form onSubmit={joinGroup} className="surface grid gap-3">
          <SectionHeader title="Join team" caption="Use an invite code from a classmate." />
          <FormField label="Invite code" error={formError && !inviteCode.trim() ? formError : undefined}>
            <input className="input uppercase" placeholder="ABC12345" value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} />
          </FormField>
          <button className="btn-secondary" disabled={saving} type="submit">
            <UserPlus size={16} /> {t("Join group")}
          </button>
        </form>
      </section>

      {groups.loading || leaderboard.loading ? <LoadingState title="Loading leaderboard" /> : null}
      {groups.error ? <ErrorState title="Could not load groups" description={groups.error} onRetry={groups.reload} /> : null}
      {leaderboard.error && groups.data?.length ? <ErrorState title="Could not load leaderboard" description={leaderboard.error} onRetry={leaderboard.reload} /> : null}

      {leaderboard.data ? (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard label="My rank" value={leaderboard.data.my_stats.rank ? `#${leaderboard.data.my_stats.rank}` : "-"} icon={Trophy} tone="amber" />
            <MetricCard label="My points" value={leaderboard.data.my_stats.points} icon={Sparkles} tone="blue" />
            <MetricCard label="On time" value={leaderboard.data.my_stats.completed_labs_on_time} icon={ShieldCheck} tone="emerald" />
            <MetricCard label="Late" value={leaderboard.data.my_stats.completed_labs_late} icon={Medal} tone="violet" />
          </section>

          <section className="space-y-3">
            <SectionHeader title="Podium" caption={weekRange} />
            {leaderboard.data.podium.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {leaderboard.data.podium.map((entry, index) => (
                  <PodiumCard key={entry.user.id} entry={entry} position={index + 1} />
                ))}
              </div>
            ) : (
              <EmptyState title="No points yet" description="Complete labs or learning tasks this week to enter the podium." />
            )}
          </section>

          <section className="space-y-3">
            <SectionHeader title="Weekly ranking" caption="Full group ranking for the current week." />
            {leaderboard.data.rankings.map((entry) => (
              <article className="tap-card flex items-center gap-3" key={entry.user.id}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold dark:bg-slate-800">#{entry.rank}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{displayName(entry)}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {entry.completed_labs_on_time} {t("on time")} · {entry.completed_labs_late} {t("late")} · {entry.completed_learning_tasks} {t("tasks")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600 dark:text-blue-300">{entry.points}</p>
                  <p className="text-xs text-slate-500">{t("pts")}</p>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : !groups.loading && groups.data?.length === 0 ? (
        <EmptyState title="No group yet" description="Create or join a group to unlock the weekly leaderboard." />
      ) : null}
    </div>
  );
}
