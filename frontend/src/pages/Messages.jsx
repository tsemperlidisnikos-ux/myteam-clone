import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import Modal from "../components/Modal";
import "../styles/page.css";

export default function Messages() {
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tab, setTab] = useState("announcements");
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const loadAnnouncements = async () => {
    try {
      const clubId = requireClubId();
      const res = await api.get(`/communication/${clubId}/announcements`);
      setAnnouncements(res.data);
    } catch {
      console.error("Failed to load announcements");
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get("/communication/notifications/me");
      setNotifications(res.data);
    } catch {
      console.error("Failed to load notifications");
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
        title,
        message,
        target_type: "club",
        target_id: null,
      });
      setTitle("");
      setMessage("");
      setShowAdd(false);
      loadAnnouncements();
    } catch {
      alert("Failed to create announcement");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Messages</h1>
        {tab === "announcements" && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + New Announcement
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
          Notifications
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
                  {new Date(a.created_at).toLocaleString()} · {a.target_type}
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
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td>{n.title}</td>
                  <td>{n.body}</td>
                  <td>{new Date(n.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <Modal title="New Announcement" onClose={() => setShowAdd(false)}>
          <input placeholder="Title" className="modal-field" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea placeholder="Message" className="modal-field" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          <button className="btn-primary" onClick={createAnnouncement} style={{ marginRight: 10 }}>Publish</button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
        </Modal>
      )}
    </div>
  );
}
