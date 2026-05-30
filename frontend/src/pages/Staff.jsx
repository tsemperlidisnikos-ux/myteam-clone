import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";
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
      showToast("Failed to load staff", "error");
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
      showToast(res.data.message || "Invite sent", "success");
      setInviteEmail("");
    } catch (err) {
      showToast(err.response?.data?.error || "Invite failed", "error");
    }
  };

  const createStaff = async () => {
    try {
      const clubId = requireClubId();
      await api.post(`/clubs/${clubId}/staff`, form);
      setShowAdd(false);
      setForm({ full_name: "", email: "", password: "", role: "coach" });
      showToast("Staff member created", "success");
      load();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to create staff", "error");
    }
  };

  if (!ready) {
    return <p>Loading...</p>;
  }

  if (!isAdmin) {
    return (
      <div className="page-panel">
        <p>Admin access required. Log out and log in again if you should be an admin.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Staff</h1>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          + Add Coach
        </button>
      </div>

      <div className="page-panel">
        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p>No staff members yet.</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role}`}>{u.role}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="page-panel" style={{ maxWidth: 420, marginBottom: 20 }}>
        <h2>{t("invite")} (email)</h2>
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
        <Modal title="Add Staff Member" onClose={() => setShowAdd(false)}>
          <input
            className="modal-field"
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
          <input
            className="modal-field"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            className="modal-field"
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            className="modal-field"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>
          <button className="btn-primary" onClick={createStaff} style={{ marginRight: 10 }}>
            Create
          </button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </button>
        </Modal>
      )}
    </div>
  );
}
