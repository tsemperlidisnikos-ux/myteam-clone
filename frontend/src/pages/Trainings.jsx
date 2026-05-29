import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useTeams from "../hooks/useTeams";
import Modal from "../components/Modal";
import "../styles/page.css";

export default function Trainings() {
  const { teams, loading: teamsLoading } = useTeams();
  const [teamId, setTeamId] = useState("");
  const [trainings, setTrainings] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    notes: "",
  });

  const loadTrainings = async (selectedTeamId) => {
    if (!selectedTeamId) {
      setTrainings([]);
      return;
    }
    try {
      const clubId = requireClubId();
      const res = await api.get(`/trainings/${clubId}?team_id=${selectedTeamId}`);
      setTrainings(res.data);
    } catch {
      alert("Failed to load trainings");
    }
  };

  useEffect(() => {
    if (teams.length > 0 && !teamId) {
      setTeamId(String(teams[0].id));
    }
  }, [teams, teamId]);

  useEffect(() => {
    if (teamId) loadTrainings(teamId);
  }, [teamId]);

  const createTraining = async () => {
    try {
      const clubId = requireClubId();
      await api.post(`/trainings/${clubId}`, {
        team_id: Number(teamId),
        ...form,
      });
      setShowAdd(false);
      setForm({ date: "", start_time: "", end_time: "", location: "", notes: "" });
      loadTrainings(teamId);
    } catch {
      alert("Failed to create training");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Trainings</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)} disabled={!teamId}>
          + New Training
        </button>
      </div>

      <div className="page-toolbar">
        <select
          className="page-select"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          disabled={teamsLoading}
        >
          {teams.length === 0 ? (
            <option value="">No teams — create one first</option>
          ) : (
            teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="page-panel">
        {trainings.length === 0 ? (
          <p>No trainings for this team.</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Coach</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {trainings.map((t) => (
                <tr key={t.id}>
                  <td>{t.date?.slice?.(0, 10) ?? t.date}</td>
                  <td>
                    {t.start_time?.slice?.(0, 5) ?? t.start_time} –{" "}
                    {t.end_time?.slice?.(0, 5) ?? t.end_time}
                  </td>
                  <td>{t.location || "—"}</td>
                  <td>{t.coach_name}</td>
                  <td>{t.notes || "—"}</td>
                  <td>
                    <Link to={`/trainings/${t.id}`} className="btn-blue">
                      Attendance
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <Modal title="New Training" onClose={() => setShowAdd(false)}>
          <input type="date" className="modal-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input type="time" className="modal-field" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          <input type="time" className="modal-field" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          <input placeholder="Location" className="modal-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <textarea placeholder="Notes" className="modal-field" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="btn-primary" onClick={createTraining} style={{ marginRight: 10 }}>Save</button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
