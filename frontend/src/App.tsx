import { Navigate, Route, Routes } from "react-router-dom";

import { TOKEN_KEY } from "./api/client";
import { Layout } from "./components/Layout";
import CalendarPage from "./pages/CalendarPage";
import DashboardPage from "./pages/DashboardPage";
import LabDetailsPage from "./pages/LabDetailsPage";
import LabsPage from "./pages/LabsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import StudyTrackDetailsPage from "./pages/StudyTrackDetailsPage";
import StudyTracksPage from "./pages/StudyTracksPage";
import SubjectDetailsPage from "./pages/SubjectDetailsPage";
import SubjectsPage from "./pages/SubjectsPage";
import TelegramAuthPage from "./pages/TelegramAuthPage";

function Protected() {
  return localStorage.getItem(TOKEN_KEY) ? <Layout /> : <Navigate to="/auth" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<TelegramAuthPage />} />
      <Route element={<Protected />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/subjects" element={<SubjectsPage />} />
        <Route path="/subjects/:id" element={<SubjectDetailsPage />} />
        <Route path="/labs" element={<LabsPage />} />
        <Route path="/labs/:id" element={<LabDetailsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/study-tracks" element={<StudyTracksPage />} />
        <Route path="/study-tracks/:id" element={<StudyTrackDetailsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
