import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
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
  }, []);

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
