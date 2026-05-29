import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId, getClubName } from "../utils/club";
import Card from "../components/Card";
import "../styles/page.css";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const clubId = requireClubId();
        const res = await api.get(`/analytics/${clubId}/club`);
        setStats(res.data);
      } catch {
        console.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const record =
    stats?.wins != null && stats?.losses != null
      ? `${stats.wins}W – ${stats.losses}L`
      : "—";

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome to {getClubName()}!</p>
        </div>
      </div>

      {loading ? (
        <p>Loading stats...</p>
      ) : stats ? (
        <>
          <div className="stat-grid">
            <Card label="Athletes" value={stats.athletes} />
            <Card label="Coaches" value={stats.coaches} />
            <Card label="Teams" value={stats.teams} />
            <Card label="Trainings" value={stats.trainings} />
            <Card label="Upcoming" value={stats.upcoming_trainings} suffix=" sessions" />
            <Card label="Matches" value={stats.matches} />
            <Card label="Attendance" value={stats.attendance_rate ?? 0} suffix="%" />
            <Card label="Record" value={record} />
          </div>

          <h2 style={{ marginTop: 32, marginBottom: 12 }}>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/teams" className="quick-action-card">
              <strong>Teams</strong>
              <span>Manage rosters & coaches</span>
            </Link>
            <Link to="/athletes" className="quick-action-card">
              <strong>Athletes</strong>
              <span>Add or edit profiles</span>
            </Link>
            <Link to="/trainings" className="quick-action-card">
              <strong>Trainings</strong>
              <span>Schedule & attendance</span>
            </Link>
            <Link to="/matches" className="quick-action-card">
              <strong>Matches</strong>
              <span>Fixtures & scores</span>
            </Link>
            <Link to="/analytics" className="quick-action-card">
              <strong>Analytics</strong>
              <span>Club & team stats</span>
            </Link>
          </div>
        </>
      ) : (
        <p>Could not load stats. Check that the backend is running.</p>
      )}
    </div>
  );
}
