import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import Modal from "../components/Modal";
import "../styles/page.css";

export default function TeamDetails() {
  const { teamId } = useParams();
  const [data, setData] = useState(null);
  const [clubAthletes, setClubAthletes] = useState([]);
  const [clubUsers, setClubUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAthlete, setShowAddAthlete] = useState(false);
  const [showAddCoach, setShowAddCoach] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [selectedCoachId, setSelectedCoachId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const clubId = requireClubId();
      const [teamRes, athletesRes, usersRes] = await Promise.all([
        api.get(`/teams/${clubId}/${teamId}`),
        api.get(`/athletes/${clubId}`),
        api.get(`/clubs/${clubId}/users`),
      ]);
      setData(teamRes.data);
      setClubAthletes(athletesRes.data);
      setClubUsers(usersRes.data);
    } catch {
      alert("Failed to load team");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const addAthlete = async () => {
    if (!selectedAthleteId) return;
    setBusy(true);
    try {
      const clubId = requireClubId();
      await api.post(`/teams/${clubId}/${teamId}/athletes`, {
        user_id: Number(selectedAthleteId),
      });
      setShowAddAthlete(false);
      setSelectedAthleteId("");
      load();
    } catch {
      alert("Failed to add athlete");
    } finally {
      setBusy(false);
    }
  };

  const removeAthlete = async (userId) => {
    if (!window.confirm("Remove this athlete from the team?")) return;
    try {
      const clubId = requireClubId();
      await api.delete(`/teams/${clubId}/${teamId}/athletes/${userId}`);
      load();
    } catch {
      alert("Failed to remove athlete");
    }
  };

  const addCoach = async () => {
    if (!selectedCoachId) return;
    setBusy(true);
    try {
      const clubId = requireClubId();
      await api.post(`/teams/${clubId}/${teamId}/coaches`, {
        user_id: Number(selectedCoachId),
      });
      setShowAddCoach(false);
      setSelectedCoachId("");
      load();
    } catch {
      alert("Failed to add coach");
    } finally {
      setBusy(false);
    }
  };

  const removeCoach = async (userId) => {
    if (!window.confirm("Remove this coach from the team?")) return;
    try {
      const clubId = requireClubId();
      await api.delete(`/teams/${clubId}/${teamId}/coaches/${userId}`);
      load();
    } catch {
      alert("Failed to remove coach");
    }
  };

  if (loading || !data?.team) {
    return <p>Loading...</p>;
  }

  const { team, coaches, athletes } = data;
  const rosterIds = new Set(athletes.map((a) => a.id));
  const coachIds = new Set(coaches.map((c) => c.id));
  const availableAthletes = clubAthletes.filter((a) => !rosterIds.has(a.id));
  const availableCoaches = clubUsers.filter(
    (u) => (u.role === "coach" || u.role === "admin") && !coachIds.has(u.id)
  );

  return (
    <div>
      <Link to="/teams" className="page-back">
        ← Back to Teams
      </Link>

      <div className="page-header">
        <h1>{team.name}</h1>
        <Link to={`/analytics?team=${teamId}`} className="btn-secondary">
          View Analytics
        </Link>
      </div>

      <div className="page-panel detail-meta">
        <p>
          <strong>Category:</strong> {team.category || "—"}
        </p>
      </div>

      <div className="detail-grid">
        <div className="page-panel">
          <div className="section-header">
            <h2>Coaches ({coaches.length})</h2>
            <button
              className="btn-primary btn-sm"
              onClick={() => setShowAddCoach(true)}
              disabled={availableCoaches.length === 0}
            >
              + Add Coach
            </button>
          </div>
          {coaches.length === 0 ? (
            <p>No coaches assigned.</p>
          ) : (
            <table className="page-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name}</td>
                    <td>{c.email}</td>
                    <td>
                      <button className="btn-red" onClick={() => removeCoach(c.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="page-panel">
          <div className="section-header">
            <h2>Roster ({athletes.length})</h2>
            <button
              className="btn-primary btn-sm"
              onClick={() => setShowAddAthlete(true)}
              disabled={availableAthletes.length === 0}
            >
              + Add Athlete
            </button>
          </div>
          {athletes.length === 0 ? (
            <p>No athletes on this team. Add athletes from your club roster.</p>
          ) : (
            <table className="page-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link to={`/athletes/${a.id}`} className="page-link">
                        {a.full_name}
                      </Link>
                    </td>
                    <td>{a.email}</td>
                    <td>
                      <button className="btn-red" onClick={() => removeAthlete(a.id)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddAthlete && (
        <Modal title="Add Athlete to Team" onClose={() => setShowAddAthlete(false)}>
          {availableAthletes.length === 0 ? (
            <p>No available athletes. Create athletes first under Athletes.</p>
          ) : (
            <>
              <select
                className="modal-field"
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
              >
                <option value="">Select athlete...</option>
                {availableAthletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} {a.position ? `(${a.position})` : ""}
                  </option>
                ))}
              </select>
              <button
                className="btn-primary"
                onClick={addAthlete}
                disabled={!selectedAthleteId || busy}
                style={{ marginRight: 10 }}
              >
                Add
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={() => setShowAddAthlete(false)}>
            Cancel
          </button>
        </Modal>
      )}

      {showAddCoach && (
        <Modal title="Add Coach to Team" onClose={() => setShowAddCoach(false)}>
          {availableCoaches.length === 0 ? (
            <p>No available coaches. Club admins can be assigned as coaches.</p>
          ) : (
            <>
              <select
                className="modal-field"
                value={selectedCoachId}
                onChange={(e) => setSelectedCoachId(e.target.value)}
              >
                <option value="">Select coach...</option>
                {availableCoaches.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
              <button
                className="btn-primary"
                onClick={addCoach}
                disabled={!selectedCoachId || busy}
                style={{ marginRight: 10 }}
              >
                Add
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={() => setShowAddCoach(false)}>
            Cancel
          </button>
        </Modal>
      )}
    </div>
  );
}
