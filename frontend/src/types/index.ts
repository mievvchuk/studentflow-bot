export type LabStatus = "not_started" | "in_progress" | "completed" | "submitted";
export type TechnologyStatus = "not_started" | "in_progress" | "completed";

export interface Timestamped {
  created_at: string;
  updated_at: string;
}

export interface User extends Timestamped {
  id: number;
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
}

export interface Subject extends Timestamped {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  color?: string | null;
}

export interface Lab extends Timestamped {
  id: number;
  user_id: number;
  subject_id?: number | null;
  title: string;
  description?: string | null;
  deadline?: string | null;
  status: LabStatus;
  github_url?: string | null;
  report_file_url?: string | null;
}

export interface LabTask extends Timestamped {
  id: number;
  lab_id: number;
  title: string;
  is_completed: boolean;
}

export interface StudyTrack extends Timestamped {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  progress: number;
}

export interface Technology extends Timestamped {
  id: number;
  study_track_id: number;
  title: string;
  status: TechnologyStatus;
  progress: number;
}

export interface LearningTask extends Timestamped {
  id: number;
  technology_id: number;
  title: string;
  description?: string | null;
  is_completed: boolean;
}

export interface Reminder extends Timestamped {
  id: number;
  user_id: number;
  lab_id?: number | null;
  remind_at: string;
  message: string;
  is_sent: boolean;
}

export interface Dashboard {
  total_subjects: number;
  total_labs: number;
  completed_labs: number;
  labs_in_progress: number;
  upcoming_deadlines: Lab[];
  study_track_progress: StudyTrack[];
  reminders_for_today: Reminder[];
}

export interface Group extends Timestamped {
  id: number;
  institution_id?: number | null;
  title: string;
  description?: string | null;
  invite_code: string;
  created_by_user_id: number;
  institution?: Institution | null;
}

export type InstitutionType = "school" | "college" | "university";

export interface Institution extends Timestamped {
  id: number;
  title: string;
  type: InstitutionType;
  city?: string | null;
  country?: string | null;
  invite_code: string;
  created_by_user_id: number;
}

export interface LeaderboardUser {
  id: number;
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  user: LeaderboardUser;
  points: number;
  completed_labs_on_time: number;
  completed_labs_late: number;
  completed_learning_tasks: number;
  streak_bonus_points: number;
}

export interface MyLeaderboardStats {
  rank: number | null;
  points: number;
  completed_labs_on_time: number;
  completed_labs_late: number;
  completed_learning_tasks: number;
  streak_bonus_points: number;
}

export interface Leaderboard {
  group: Group;
  week_start: string;
  week_end: string;
  podium: LeaderboardEntry[];
  rankings: LeaderboardEntry[];
  my_stats: MyLeaderboardStats;
}

export interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
  colorScheme?: "light" | "dark";
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
