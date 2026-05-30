import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import Modal from "../components/Modal";
import { downloadCsv } from "../utils/csv";
import { t, roleLabel } from "../i18n/el";
import { showToast } from "../utils/toast";
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
      showToast(t("teamLoadFailed"), "error");
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
      showToast("Αποτυχία προσθήκης αθλητή", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeAthlete = async (userId) => {
    if (!window.confirm(t("confirmRemoveAthlete"))) return;
    try {
      const clubId = requireClubId();
      await api.delete(`/teams/${clubId}/${teamId}/athletes/${userId}`);
      load();
    } catch {
      showToast("Αποτυχία αφαίρεσης αθλητή", "error");
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
      showToast("Αποτυχία προσθήκης προπονητή", "error");
    } finally {
      setBusy(false);
    }
  };

  const removeCoach = async (userId) => {
    if (!window.confirm(t("confirmRemoveCoach"))) return;
    try {
      const clubId = requireClubId();
      await api.delete(`/teams/${clubId}/${teamId}/coaches/${userId}`);
      load();
    } catch {
      showToast("Αποτυχία αφαίρεσης προπονητή", "error");
    }
  };

  if (loading || !data?.team) {
    return <p>{t("loading")}</p>;
  }

  const { team, coaches, athletes } = data;
  const rosterIds = new Set(athletes.map((a) => a.id));
  const coachIds = new Set(coaches.map((c) => c.id));
  const availableAthletes = clubAthletes.filter((a) => !rosterIds.has(a.id));
  const availableCoaches = clubUsers.filter(
    (u) => (u.role === "coach" || u.role === "admin") && !coachIds.has(u.id)
  );

  const exportRoster = () => {
    if (!data?.athletes?.length) return;
    downloadCsv(
      `${data.team.name}-roster.csv`,
      data.athletes.map((a) => ({ name: a.full_name, email: a.email }))
    );
  };

  return (
    <div>
      <Link to="/teams" className="page-back">
        {t("backToTeams")}
      </Link>

      <div className="page-header">
        <h1>{team.name}</h1>
        <Link to={`/analytics?team=${teamId}`} className="btn-secondary">
          {t("viewAnalytics")}
        </Link>
      </div>

      <div className="page-panel detail-meta">
        <p>
          <strong>{t("category")}:</strong> {team.category || "—"}
        </p>
      </div>

      <div className="detail-grid">
        <div className="page-panel">
          <div className="section-header">
            <h2>
              {t("coaches")} ({coaches.length})
            </h2>
            <button
              className="btn-primary btn-sm"
              onClick={() => setShowAddCoach(true)}
              disabled={availableCoaches.length === 0}
            >
              + {t("addCoach")}
            </button>
          </div>
          {coaches.length === 0 ? (
            <p>{t("noCoaches")}</p>
          ) : (
            <table className="page-table">
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t("email")}</th>
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
                        {t("remove")}
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
            <h2>
              {t("roster")} ({athletes.length})
            </h2>
            <div>
              {athletes.length > 0 && (
                <button className="btn-secondary btn-sm" onClick={exportRoster} style={{ marginRight: 8 }}>
                  {t("export")}
                </button>
              )}
              <button
                className="btn-primary btn-sm"
                onClick={() => setShowAddAthlete(true)}
                disabled={availableAthletes.length === 0}
              >
                + {t("addAthlete")}
              </button>
            </div>
          </div>
          {athletes.length === 0 ? (
            <p>{t("noAthletesOnTeam")}</p>
          ) : (
            <table className="page-table">
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t("email")}</th>
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
                        {t("remove")}
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
        <Modal title={t("addAthleteToTeam")} onClose={() => setShowAddAthlete(false)}>
          {availableAthletes.length === 0 ? (
            <p>{t("noAvailableAthletes")}</p>
          ) : (
            <>
              <select
                className="modal-field"
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
              >
                <option value="">{t("selectAthlete")}</option>
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
                {t("add")}
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={() => setShowAddAthlete(false)}>
            {t("cancel")}
          </button>
        </Modal>
      )}

      {showAddCoach && (
        <Modal title={t("addCoachToTeam")} onClose={() => setShowAddCoach(false)}>
          {availableCoaches.length === 0 ? (
            <p>{t("noAvailableCoachesHint")}</p>
          ) : (
            <>
              <select
                className="modal-field"
                value={selectedCoachId}
                onChange={(e) => setSelectedCoachId(e.target.value)}
              >
                <option value="">{t("selectCoach")}</option>
                {availableCoaches.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({roleLabel(u.role)})
                  </option>
                ))}
              </select>
              <button
                className="btn-primary"
                onClick={addCoach}
                disabled={!selectedCoachId || busy}
                style={{ marginRight: 10 }}
              >
                {t("add")}
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={() => setShowAddCoach(false)}>
            {t("cancel")}
          </button>
        </Modal>
      )}
    </div>
  );
}
