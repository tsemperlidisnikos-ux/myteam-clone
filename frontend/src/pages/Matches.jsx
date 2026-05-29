import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useTeams from "../hooks/useTeams";
import Modal from "../components/Modal";
import "../styles/page.css";

export default function Matches() {
  const { teams, loading: teamsLoading } = useTeams();
  const [teamId, setTeamId] = useState("");
  const [matches, setMatches] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    opponent: "",
    date: "",
    start_time: "",
    location: "",
    competition: "",
    notes: "",
  });

  const loadMatches = async (selectedTeamId) => {
    if (!selectedTeamId) {
      setMatches([]);
      return;
    }
    try {
      const clubId = requireClubId();
      const res = await api.get(`/matches/${clubId}?team_id=${selectedTeamId}`);
      setMatches(res.data);
    } catch {
      alert("Failed to load matches");
    }
  };

  useEffect(() => {
    if (teams.length > 0 && !teamId) {
      setTeamId(String(teams[0].id));
    }
  }, [teams, teamId]);

  useEffect(() => {
    if (teamId) loadMatches(teamId);
  }, [teamId]);

  const createMatch = async () => {
    try {
      const clubId = requireClubId();
      await api.post(`/matches/${clubId}`, {
        team_id: Number(teamId),
        ...form,
      });
      setShowAdd(false);
      setForm({ opponent: "", date: "", start_time: "", location: "", competition: "", notes: "" });
      loadMatches(teamId);
    } catch {
      alert("Failed to create match");
    }
  };

  const updateScore = async (match) => {
    const our = window.prompt("Our score:", match.our_score ?? "");
    if (our === null) return;
    const opp = window.prompt("Opponent score:", match.opponent_score ?? "");
    if (opp === null) return;

    try {
      const clubId = requireClubId();
      await api.put(`/matches/${clubId}/${match.id}`, {
        our_score: Number(our),
        opponent_score: Number(opp),
      });
      loadMatches(teamId);
    } catch {
      alert("Failed to update score");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Matches</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)} disabled={!teamId}>
          + New Match
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
        {matches.length === 0 ? (
          <p>No matches for this team.</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Opponent</th>
                <th>Competition</th>
                <th>Location</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td>{m.date?.slice?.(0, 10) ?? m.date}</td>
                  <td>{m.opponent}</td>
                  <td>{m.competition || "—"}</td>
                  <td>{m.location || "—"}</td>
                  <td>
                    {m.our_score != null ? `${m.our_score} - ${m.opponent_score}` : "—"}
                    <button className="btn-blue" style={{ marginLeft: 8 }} onClick={() => updateScore(m)}>
                      Set score
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <Modal title="New Match" onClose={() => setShowAdd(false)}>
          <input placeholder="Opponent" className="modal-field" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
          <input type="date" className="modal-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input type="time" className="modal-field" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          <input placeholder="Location" className="modal-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input placeholder="Competition" className="modal-field" value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} />
          <textarea placeholder="Notes" className="modal-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="btn-primary" onClick={createMatch} style={{ marginRight: 10 }}>Save</button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
