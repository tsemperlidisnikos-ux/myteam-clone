import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useTeams from "../hooks/useTeams";
import useClubRole from "../hooks/useClubRole";
import { loadParentMatches } from "../utils/parentData";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function Matches() {
  const { teams, loading: teamsLoading } = useTeams();
  const { isAthlete, isStaff, isParent } = useClubRole();
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
    try {
      const clubId = requireClubId();
      if (isParent) {
        setMatches(await loadParentMatches(clubId));
        return;
      }
      if (isAthlete) {
        const res = await api.get(`/matches/${clubId}/my`);
        setMatches(res.data);
        return;
      }
      if (!selectedTeamId) {
        setMatches([]);
        return;
      }
      const res = await api.get(`/matches/${clubId}?team_id=${selectedTeamId}`);
      setMatches(res.data);
    } catch {
      showToast("Αποτυχία φόρτωσης αγώνων", "error");
    }
  };

  useEffect(() => {
    if (isAthlete || isParent) {
      loadMatches();
      return;
    }
    if (teams.length > 0 && !teamId) {
      setTeamId(String(teams[0].id));
    }
  }, [teams, teamId, isAthlete, isParent]);

  useEffect(() => {
    if (!isAthlete && !isParent && teamId) loadMatches(teamId);
  }, [teamId, isAthlete, isParent]);

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
      showToast("Αποτυχία δημιουργίας αγώνα", "error");
    }
  };

  const scoreLabel = (m) =>
    m.our_score != null && m.opponent_score != null
      ? `${m.our_score} – ${m.opponent_score}`
      : "—";

  return (
    <div>
      <div className="page-header">
        <h1>{t("matches")}</h1>
        {isStaff && (
          <button className="btn-primary" onClick={() => setShowAdd(true)} disabled={!teamId}>
            + {t("newMatch")}
          </button>
        )}
      </div>

      {!isAthlete && !isParent && (
      <div className="page-toolbar">
        <select
          className="page-select"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          disabled={teamsLoading}
        >
          {teams.length === 0 ? (
            <option value="">{t("noTeamsYet")}</option>
          ) : (
            teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))
          )}
        </select>
      </div>
      )}

      <div className="page-panel">
        {matches.length === 0 ? (
          <p>{t("noMatchesTeam")}</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t("opponent")}</th>
                <th>{t("competition")}</th>
                <th>{t("location")}</th>
                <th>{t("score")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id}>
                  <td>{m.date?.slice?.(0, 10) ?? m.date}</td>
                  <td>{m.opponent}</td>
                  <td>{m.competition || "—"}</td>
                  <td>{m.location || "—"}</td>
                  <td>{scoreLabel(m)}</td>
                  {!isParent && (
                    <td className="actions-cell">
                      <Link to={`/matches/${m.id}`} className="btn-blue btn-link-action">
                        {t("statsScore")}
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <Modal title={t("newMatch")} onClose={() => setShowAdd(false)}>
          <input placeholder={t("opponent")} className="modal-field" value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} />
          <input type="date" className="modal-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input type="time" className="modal-field" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          <input placeholder={t("location")} className="modal-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <input placeholder={t("competition")} className="modal-field" value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })} />
          <textarea placeholder={t("notes")} className="modal-field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="btn-primary" onClick={createMatch} style={{ marginRight: 10 }}>{t("save")}</button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>{t("cancel")}</button>
        </Modal>
      )}
    </div>
  );
}
