import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId, isStaff } from "../utils/club";
import useTeams from "../hooks/useTeams";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import "../styles/page.css";

export default function Messages() {
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState("announcements");
  const [showAdd, setShowAdd] = useState(false);
  const { teams } = useTeams();
  const [form, setForm] = useState({
    title: "",
    message: "",
    target_type: "club",
    target_id: "",
  });

  const loadAnnouncements = async () => {
    try {
      const clubId = requireClubId();
      const res = await api.get(`/communication/${clubId}/announcements`);
      setAnnouncements(res.data);
    } catch {
      showToast("Failed to load announcements", "error");
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get("/communication/notifications/me");
      setNotifications(res.data);
    } catch {
      showToast("Failed to load notifications", "error");
    }
  };

  useEffect(() => {
    loadAnnouncements();
    loadNotifications();
  }, []);

  const createAnnouncement = async () => {
    try {
      const clubId = requireClubId();
      await api.post(`/communication/${clubId}/announcements`, {
        title: form.title,
        message: form.message,
        target_type: form.target_type,
        target_id:
          form.target_type === "club" ? null : Number(form.target_id) || null,
      });
      setForm({ title: "", message: "", target_type: "club", target_id: "" });
      setShowAdd(false);
      showToast("Announcement published", "success");
      loadAnnouncements();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to create announcement", "error");
    }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/communication/notifications/${id}/read`);
      loadNotifications();
    } catch {
      showToast("Failed to mark as read", "error");
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/communication/notifications/me/read-all");
      showToast("All notifications marked read", "success");
      loadNotifications();
    } catch {
      showToast("Failed to mark all read", "error");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      <div className="page-header">
        <h1>Messages</h1>
        {tab === "announcements" && isStaff() && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + New Announcement
          </button>
        )}
        {tab === "notifications" && unreadCount > 0 && (
          <button className="btn-secondary" onClick={markAllRead}>
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      <div className="page-toolbar">
        <button
          className={tab === "announcements" ? "btn-primary" : "btn-secondary"}
          onClick={() => setTab("announcements")}
        >
          Announcements
        </button>
        <button
          className={tab === "notifications" ? "btn-primary" : "btn-secondary"}
          onClick={() => setTab("notifications")}
        >
          Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
        </button>
      </div>

      <div className="page-panel">
        {tab === "announcements" ? (
          announcements.length === 0 ? (
            <p>No announcements yet.</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="announcement-item">
                <strong>{a.title}</strong>
                <p style={{ margin: "8px 0 0" }}>{a.message}</p>
                <div className="announcement-meta">
                  {new Date(a.created_at).toLocaleString()}
                  {a.author_name ? ` · ${a.author_name}` : ""}
                  {a.target_type !== "club" ? ` · ${a.target_type}` : " · club-wide"}
                </div>
              </div>
            ))
          )
        ) : notifications.length === 0 ? (
          <p>No notifications.</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Body</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className={n.is_read ? "" : "row-unread"}>
                  <td>{n.title}</td>
                  <td>{n.body}</td>
                  <td>{new Date(n.created_at).toLocaleString()}</td>
                  <td>
                    {!n.is_read && (
                      <button className="btn-blue" onClick={() => markRead(n.id)}>
                        Mark read
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <Modal title="New Announcement" onClose={() => setShowAdd(false)}>
          <input
            placeholder="Title"
            className="modal-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            placeholder="Message"
            className="modal-field"
            rows={4}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
          <select
            className="modal-field"
            value={form.target_type}
            onChange={(e) => setForm({ ...form, target_type: e.target.value, target_id: "" })}
          >
            <option value="club">Entire club</option>
            <option value="team">Specific team</option>
          </select>
          {form.target_type === "team" && (
            <select
              className="modal-field"
              value={form.target_id}
              onChange={(e) => setForm({ ...form, target_id: e.target.value })}
            >
              <option value="">Select team...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
          <button className="btn-primary" onClick={createAnnouncement} style={{ marginRight: 10 }}>
            Publish
          </button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>
            Cancel
          </button>
        </Modal>
      )}
    </div>
  );
}
