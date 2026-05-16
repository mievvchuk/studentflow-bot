import { api } from "./client";
import type {
  Dashboard,
  Group,
  Institution,
  Lab,
  LabTask,
  Leaderboard,
  LearningTask,
  Reminder,
  StudyTrack,
  Subject,
  Technology,
  User
} from "../types";

export async function telegramAuth(initData: string) {
  const { data } = await api.post<{ access_token: string; user: User }>("/auth/telegram", { initData });
  return data;
}

export async function getMe() {
  const { data } = await api.get<User>("/me");
  return data;
}

export const dashboardApi = {
  get: async () => (await api.get<Dashboard>("/dashboard")).data
};

export const groupsApi = {
  list: async () => (await api.get<Group[]>("/groups")).data,
  create: async (payload: { title: string; description?: string | null; institution_id?: number | null }) => (await api.post<Group>("/groups", payload)).data,
  join: async (invite_code: string) => (await api.post<Group>("/groups/join", { invite_code })).data
};

export const institutionsApi = {
  list: async () => (await api.get<Institution[]>("/institutions")).data,
  create: async (payload: { title: string; type: string; city?: string | null; country?: string | null }) =>
    (await api.post<Institution>("/institutions", payload)).data,
  join: async (invite_code: string) => (await api.post<Institution>("/institutions/join", { invite_code })).data
};

export const leaderboardApi = {
  get: async (groupId?: number) => (await api.get<Leaderboard>("/leaderboard", { params: { group_id: groupId } })).data
};

export const subjectsApi = {
  list: async () => (await api.get<Subject[]>("/subjects")).data,
  get: async (id: number) => (await api.get<Subject>(`/subjects/${id}`)).data,
  create: async (payload: Partial<Subject>) => (await api.post<Subject>("/subjects", payload)).data,
  update: async (id: number, payload: Partial<Subject>) => (await api.put<Subject>(`/subjects/${id}`, payload)).data,
  remove: async (id: number) => api.delete(`/subjects/${id}`)
};

export const labsApi = {
  list: async (params?: Record<string, string | number | undefined>) => (await api.get<Lab[]>("/labs", { params })).data,
  get: async (id: number) => (await api.get<Lab>(`/labs/${id}`)).data,
  create: async (payload: Partial<Lab>) => (await api.post<Lab>("/labs", payload)).data,
  update: async (id: number, payload: Partial<Lab>) => (await api.put<Lab>(`/labs/${id}`, payload)).data,
  remove: async (id: number) => api.delete(`/labs/${id}`),
  tasks: async (labId: number) => (await api.get<LabTask[]>(`/labs/${labId}/tasks`)).data,
  createTask: async (labId: number, payload: Partial<LabTask>) => (await api.post<LabTask>(`/labs/${labId}/tasks`, payload)).data,
  updateTask: async (id: number, payload: Partial<LabTask>) => (await api.put<LabTask>(`/lab-tasks/${id}`, payload)).data,
  removeTask: async (id: number) => api.delete(`/lab-tasks/${id}`)
};

export const tracksApi = {
  list: async () => (await api.get<StudyTrack[]>("/study-tracks")).data,
  get: async (id: number) => (await api.get<StudyTrack>(`/study-tracks/${id}`)).data,
  create: async (payload: Partial<StudyTrack>) => (await api.post<StudyTrack>("/study-tracks", payload)).data,
  update: async (id: number, payload: Partial<StudyTrack>) => (await api.put<StudyTrack>(`/study-tracks/${id}`, payload)).data,
  remove: async (id: number) => api.delete(`/study-tracks/${id}`),
  technologies: async (trackId: number) => (await api.get<Technology[]>(`/study-tracks/${trackId}/technologies`)).data,
  createTechnology: async (trackId: number, payload: Partial<Technology>) =>
    (await api.post<Technology>(`/study-tracks/${trackId}/technologies`, payload)).data,
  updateTechnology: async (id: number, payload: Partial<Technology>) => (await api.put<Technology>(`/technologies/${id}`, payload)).data,
  removeTechnology: async (id: number) => api.delete(`/technologies/${id}`),
  tasks: async (technologyId: number) => (await api.get<LearningTask[]>(`/technologies/${technologyId}/tasks`)).data,
  createTask: async (technologyId: number, payload: Partial<LearningTask>) =>
    (await api.post<LearningTask>(`/technologies/${technologyId}/tasks`, payload)).data,
  updateTask: async (id: number, payload: Partial<LearningTask>) => (await api.put<LearningTask>(`/learning-tasks/${id}`, payload)).data,
  removeTask: async (id: number) => api.delete(`/learning-tasks/${id}`)
};

export const remindersApi = {
  list: async () => (await api.get<Reminder[]>("/reminders")).data,
  create: async (payload: Partial<Reminder>) => (await api.post<Reminder>("/reminders", payload)).data,
  update: async (id: number, payload: Partial<Reminder>) => (await api.put<Reminder>(`/reminders/${id}`, payload)).data,
  remove: async (id: number) => api.delete(`/reminders/${id}`)
};
