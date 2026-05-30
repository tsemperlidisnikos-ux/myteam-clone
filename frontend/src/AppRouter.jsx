import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import RegisterClub from "./pages/RegisterClub";
import ChooseClub from "./pages/ChooseClub";
import ForgotPassword from "./pages/ForgotPassword";
import AcceptInvite from "./pages/AcceptInvite";
import Medical from "./pages/Medical";
import ParentPortal from "./pages/ParentPortal";
import Dashboard from "./pages/Dashboard";
import Teams from "./pages/Teams";
import Athletes from "./pages/Athletes";
import Trainings from "./pages/Trainings";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import TrainingDetail from "./pages/TrainingDetail";
import TeamDetails from "./pages/TeamDetails";
import AthleteProfile from "./pages/AthleteProfile";
import MyProfile from "./pages/MyProfile";
import MatchDetail from "./pages/MatchDetail";
import Staff from "./pages/Staff";
import Settings from "./pages/Settings";

import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import StaffRoute from "./components/StaffRoute";
import ToastContainer from "./components/ToastContainer";
import { ThemeProvider } from "./hooks/useTheme.jsx";

function withLayout(Page) {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Page />
      </MainLayout>
    </ProtectedRoute>
  );
}

function withStaffLayout(Page) {
  return (
    <ProtectedRoute>
      <MainLayout>
        <StaffRoute>
          <Page />
        </StaffRoute>
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
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<RegisterClub />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/choose-club" element={<ChooseClub />} />

          <Route path="/dashboard" element={withLayout(Dashboard)} />
          <Route path="/my-profile" element={withLayout(MyProfile)} />
          <Route path="/teams" element={withStaffLayout(Teams)} />
          <Route path="/teams/:teamId" element={withStaffLayout(TeamDetails)} />
          <Route path="/athletes" element={withStaffLayout(Athletes)} />
          <Route path="/athletes/:athleteId" element={withLayout(AthleteProfile)} />
          <Route path="/trainings" element={withLayout(Trainings)} />
          <Route path="/trainings/:trainingId" element={withLayout(TrainingDetail)} />
          <Route path="/settings" element={withLayout(Settings)} />
          <Route path="/staff" element={withAdminLayout(Staff)} />
          <Route path="/matches" element={withLayout(Matches)} />
          <Route path="/matches/:matchId" element={withLayout(MatchDetail)} />
          <Route path="/calendar" element={withLayout(Calendar)} />
          <Route path="/messages" element={withLayout(Messages)} />
          <Route path="/analytics" element={withStaffLayout(Analytics)} />
          <Route path="/medical" element={withStaffLayout(Medical)} />
          <Route path="/parents" element={withStaffLayout(ParentPortal)} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </ThemeProvider>
  );
}
