import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import { t, roleLabel } from "../i18n/el";
import "../styles/page.css";

export default function Staff() {
  const { isAdmin, ready } = useClubRole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "coach",
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("athlete");
  const [inviteAthleteId, setInviteAthleteId] = useState("");
  const [athletes, setAthletes] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const clubId = requireClubId();
      const res = await api.get(`/clubs/${clubId}/users`);
      setUsers(res.data.filter((u) => u.role === "admin" || u.role === "coach"));
    } catch {
      showToast("Αποτυχία φόρτωσης προσωπικού", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const clubId = requireClubId();
    api.get(`/athletes/${clubId}`).then((res) => setAthletes(res.data)).catch(() => {});
  }, []);

  const sendInvite = async () => {
    try {
      const clubId = requireClubId();
      const res = await api.post(`/clubs/${clubId}/invites`, {
        email: inviteEmail,
        role: inviteRole,
        ...(inviteRole === "parent" && inviteAthleteId
          ? { athlete_id: Number(inviteAthleteId) }
          : {}),
      });
      showToast(res.data.message || t("sendInvite"), "success");
      setInviteEmail("");
    } catch (err) {
      showToast(err.response?.data?.error || "Αποτυχία πρόσκλησης", "error");
    }
  };

  const createStaff = async () => {
    try {
      const clubId = requireClubId();
      await api.post(`/clubs/${clubId}/staff`, form);
      setShowAdd(false);
      setForm({ full_name: "", email: "", password: "", role: "coach" });
      showToast("Το μέλος προστέθηκε", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.error || "Αποτυχία δημιουργίας", "error");
    }
  };

  if (!ready) {
    return <p>{t("loading")}</p>;
  }

  if (!isAdmin) {
    return (
      <div className="page-panel">
        <p>{t("adminRequired")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>{t("staff")}</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + {t("addCoach")}
        </button>
      </div>

      <div className="page-panel">
        {loading ? (
          <p>{t("loading")}</p>
        ) : users.length === 0 ? (
          <p>{t("noStaffYet")}</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("email")}</th>
                <th>{t("role")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>{roleLabel(u.role)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="page-panel" style={{ maxWidth: 420, marginBottom: 20 }}>
        <h2>{t("inviteByEmail")}</h2>
        <input
          className="modal-field"
          placeholder="email@example.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <select
          className="modal-field"
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value)}
        >
          <option value="athlete">{t("roleAthlete")}</option>
          <option value="coach">{t("roleCoach")}</option>
          <option value="parent">{t("roleParent")}</option>
        </select>
        {inviteRole === "parent" && (
          <select
            className="modal-field"
            value={inviteAthleteId}
            onChange={(e) => setInviteAthleteId(e.target.value)}
          >
            <option value="">{t("athlete")}</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
        )}
        <button className="btn-primary" onClick={sendInvite}>
          {t("sendInvite")}
        </button>
      </div>

      {showAdd && (
        <Modal title={t("addStaffMember")} onClose={() => setShowAdd(false)}>
          <input
            className="modal-field"
            placeholder={t("fullName")}
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <input
            className="modal-field"
            placeholder={t("email")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            className="modal-field"
            placeholder={t("passwordMin")}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            className="modal-field"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="coach">{t("roleCoach")}</option>
            <option value="admin">{t("roleAdmin")}</option>
          </select>
          <button className="btn-primary" onClick={createStaff} style={{ marginRight: 10 }}>
            {t("create")}
          </button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>
            {t("cancel")}
          </button>
        </Modal>
      )}
    </div>
  );
}
