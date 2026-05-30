import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useTeams from "../hooks/useTeams";
import useClubRole from "../hooks/useClubRole";
import { loadParentTrainings } from "../utils/parentData";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function Trainings() {
  const { teams, loading: teamsLoading } = useTeams();
  const { isAthlete, isStaff, isParent } = useClubRole();
  const [teamId, setTeamId] = useState("");
  const [trainings, setTrainings] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [form, setForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    notes: "",
  });
  const [recForm, setRecForm] = useState({
    weekday: "1",
    weeks: "8",
    start_date: "",
    start_time: "",
    end_time: "",
    location: "",
    notes: "",
  });

  const weekdays = [
    { v: "1", l: t("monday") },
    { v: "2", l: t("tuesday") },
    { v: "3", l: t("wednesday") },
    { v: "4", l: t("thursday") },
    { v: "5", l: t("friday") },
    { v: "6", l: t("saturday") },
    { v: "0", l: t("sunday") },
  ];

  const loadTrainings = async (selectedTeamId) => {
    try {
      const clubId = requireClubId();
      if (isParent) {
        setTrainings(await loadParentTrainings(clubId));
        return;
      }
      if (isAthlete) {
        const res = await api.get(`/trainings/${clubId}/my`);
        setTrainings(res.data);
        return;
      }
      if (!selectedTeamId) {
        setTrainings([]);
        return;
      }
      const res = await api.get(`/trainings/${clubId}?team_id=${selectedTeamId}`);
      setTrainings(res.data);
    } catch {
      showToast("Αποτυχία φόρτωσης προπονήσεων", "error");
    }
  };

  useEffect(() => {
    if (isAthlete || isParent) {
      loadTrainings();
      return;
    }
    if (teams.length > 0 && !teamId) {
      setTeamId(String(teams[0].id));
    }
  }, [teams, teamId, isAthlete, isParent]);

  useEffect(() => {
    if (!isAthlete && !isParent && teamId) loadTrainings(teamId);
  }, [teamId, isAthlete, isParent]);

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
      showToast("Αποτυχία δημιουργίας προπόνησης", "error");
    }
  };

  const createRecurring = async () => {
    try {
      const clubId = requireClubId();
      await api.post(`/trainings/${clubId}/recurring`, {
        team_id: Number(teamId),
        weekday: Number(recForm.weekday),
        weeks: Number(recForm.weeks),
        start_date: recForm.start_date,
        start_time: recForm.start_time,
        end_time: recForm.end_time,
        location: recForm.location,
        notes: recForm.notes,
      });
      setShowRecurring(false);
      setRecForm({
        weekday: "1",
        weeks: "8",
        start_date: "",
        start_time: "",
        end_time: "",
        location: "",
        notes: "",
      });
      loadTrainings(teamId);
    } catch {
      showToast("Αποτυχία δημιουργίας επαναλαμβανόμενων προπονήσεων", "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t("trainings")}</h1>
        {isStaff && (
          <>
            <button
              className="btn-secondary"
              onClick={() => setShowRecurring(true)}
              disabled={!teamId}
              style={{ marginRight: 8 }}
            >
              {t("recurringTraining")}
            </button>
            <button className="btn-primary" onClick={() => setShowAdd(true)} disabled={!teamId}>
              + {t("newTraining")}
            </button>
          </>
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
        {trainings.length === 0 ? (
          <p>{t("noTrainingsTeam")}</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>{t("date")}</th>
                <th>{t("time")}</th>
                <th>{t("location")}</th>
                <th>{t("coach")}</th>
                <th>{t("notes")}</th>
              </tr>
            </thead>
            <tbody>
              {trainings.map((tr) => (
                <tr key={tr.id}>
                  <td>{tr.date?.slice?.(0, 10) ?? tr.date}</td>
                  <td>
                    {tr.start_time?.slice?.(0, 5) ?? tr.start_time} –{" "}
                    {tr.end_time?.slice?.(0, 5) ?? tr.end_time}
                  </td>
                  <td>{tr.location || "—"}</td>
                  <td>{tr.coach_name}</td>
                  <td>{tr.notes || "—"}</td>
                  {!isParent && (
                    <td>
                      <Link to={`/trainings/${tr.id}`} className="btn-blue">
                        {t("attendance")}
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
        <Modal title={t("newTraining")} onClose={() => setShowAdd(false)}>
          <input type="date" className="modal-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input type="time" className="modal-field" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          <input type="time" className="modal-field" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          <input placeholder={t("location")} className="modal-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <textarea placeholder={t("notes")} className="modal-field" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="btn-primary" onClick={createTraining} style={{ marginRight: 10 }}>{t("save")}</button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>{t("cancel")}</button>
        </Modal>
      )}

      {showRecurring && (
        <Modal title={t("recurringTraining")} onClose={() => setShowRecurring(false)}>
          <select
            className="modal-field"
            value={recForm.weekday}
            onChange={(e) => setRecForm({ ...recForm, weekday: e.target.value })}
          >
            {weekdays.map((d) => (
              <option key={d.v} value={d.v}>
                {d.l}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            max="52"
            className="modal-field"
            placeholder={t("weeks")}
            value={recForm.weeks}
            onChange={(e) => setRecForm({ ...recForm, weeks: e.target.value })}
          />
          <input
            type="date"
            className="modal-field"
            value={recForm.start_date}
            onChange={(e) => setRecForm({ ...recForm, start_date: e.target.value })}
          />
          <input
            type="time"
            className="modal-field"
            value={recForm.start_time}
            onChange={(e) => setRecForm({ ...recForm, start_time: e.target.value })}
          />
          <input
            type="time"
            className="modal-field"
            value={recForm.end_time}
            onChange={(e) => setRecForm({ ...recForm, end_time: e.target.value })}
          />
          <input
            placeholder={t("location")}
            className="modal-field"
            value={recForm.location}
            onChange={(e) => setRecForm({ ...recForm, location: e.target.value })}
          />
          <textarea
            placeholder={t("notes")}
            className="modal-field"
            rows={2}
            value={recForm.notes}
            onChange={(e) => setRecForm({ ...recForm, notes: e.target.value })}
          />
          <button className="btn-primary" onClick={createRecurring} style={{ marginRight: 10 }}>
            {t("save")}
          </button>
          <button className="btn-secondary" onClick={() => setShowRecurring(false)}>
            {t("cancel")}
          </button>
        </Modal>
      )}
    </div>
  );
}
