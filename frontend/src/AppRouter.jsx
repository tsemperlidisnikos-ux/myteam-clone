import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import RegisterClub from "./pages/RegisterClub";
import ChooseClub from "./pages/ChooseClub";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Athletes from "./pages/Athletes";
import Trainings from "./pages/Trainings";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Analytics from "./pages/Analytics";
import TrainingDetail from "./pages/TrainingDetail";
import TeamDetails from "./pages/TeamDetails";
import AthleteProfile from "./pages/AthleteProfile";
import MatchDetail from "./pages/MatchDetail";
import Staff from "./pages/Staff";
import Settings from "./pages/Settings";

import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function withLayout(Page) {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Page />
      </MainLayout>
    </ProtectedRoute>
  );
}

function withAdminLayout(Page) {
  return (
    <ProtectedRoute>
      <MainLayout>
        <AdminRoute>
          <Page />
        </AdminRoute>
      </MainLayout>
    </ProtectedRoute>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RegisterClub />} />
        <Route path="/choose-club" element={<ChooseClub />} />

        <Route path="/dashboard" element={withLayout(Dashboard)} />
        <Route path="/teams" element={withLayout(Teams)} />
        <Route path="/teams/:teamId" element={withLayout(TeamDetails)} />
        <Route path="/athletes" element={withLayout(Athletes)} />
        <Route path="/athletes/:athleteId" element={withLayout(AthleteProfile)} />
        <Route path="/trainings" element={withLayout(Trainings)} />
        <Route path="/trainings/:trainingId" element={withLayout(TrainingDetail)} />
        <Route path="/settings" element={withLayout(Settings)} />
        <Route path="/staff" element={withAdminLayout(Staff)} />
        <Route path="/matches" element={withLayout(Matches)} />
        <Route path="/matches/:matchId" element={withLayout(MatchDetail)} />
        <Route path="/messages" element={withLayout(Messages)} />
        <Route path="/analytics" element={withLayout(Analytics)} />
      </Routes>
    </BrowserRouter>
  );
}
