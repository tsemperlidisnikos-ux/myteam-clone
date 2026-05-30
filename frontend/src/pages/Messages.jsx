import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useTeams from "../hooks/useTeams";
import useClubRole from "../hooks/useClubRole";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function Messages() {
  const { isStaff } = useClubRole();
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [dmText, setDmText] = useState("");
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
      showToast("Αποτυχία φόρτωσης ανακοινώσεων", "error");
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await api.get("/communication/notifications/me");
      setNotifications(res.data);
    } catch {
      showToast("Αποτυχία φόρτωσης ειδοποιήσεων", "error");
    }
  };

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const clubId = requireClubId();
      const res = await api.get(`/communication/${clubId}/contacts`);
      setContacts(res.data);
    } catch {
      showToast("Αποτυχία φόρτωσης επαφών", "error");
    } finally {
      setContactsLoading(false);
    }
  };

  const loadConversation = async (userId) => {
    try {
      const res = await api.get(`/communication/messages/${userId}`);
      setConversation(res.data);
    } catch {
      showToast("Αποτυχία φόρτωσης συνομιλίας", "error");
    }
  };

  useEffect(() => {
    loadAnnouncements();
    loadNotifications();
  }, []);

  useEffect(() => {
    if (tab === "dm") loadContacts();
  }, [tab]);

  useEffect(() => {
    if (activeContact) loadConversation(activeContact.id);
  }, [activeContact]);

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
      showToast("Η ανακοίνωση δημοσιεύτηκε", "success");
      loadAnnouncements();
      loadNotifications();
    } catch (err) {
      showToast(err.response?.data?.error || "Αποτυχία δημοσίευσης", "error");
    }
  };

  const sendDm = async () => {
    if (!activeContact || !dmText.trim()) return;
    try {
      await api.post("/communication/messages", {
        receiver_id: activeContact.id,
        content: dmText.trim(),
      });
      setDmText("");
      loadConversation(activeContact.id);
      showToast("Το μήνυμα στάλθηκε", "success");
    } catch {
      showToast("Αποτυχία αποστολής", "error");
    }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/communication/notifications/${id}/read`);
      loadNotifications();
    } catch {
      showToast("Αποτυχία", "error");
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/communication/notifications/me/read-all");
      showToast("Όλες οι ειδοποιήσεις διαβάστηκαν", "success");
      loadNotifications();
    } catch {
      showToast("Αποτυχία", "error");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const myId = JSON.parse(localStorage.getItem("user") || "{}").id;

  return (
    <div>
      <div className="page-header">
        <h1>{t("messages")}</h1>
        {tab === "announcements" && isStaff && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + Νέα Ανακοίνωση
          </button>
        )}
        {tab === "notifications" && unreadCount > 0 && (
          <button className="btn-secondary" onClick={markAllRead}>
            Ολα διαβασμένα ({unreadCount})
          </button>
        )}
      </div>

      <div className="page-toolbar">
        <button
          className={tab === "announcements" ? "btn-primary" : "btn-secondary"}
          onClick={() => setTab("announcements")}
        >
          Ανακοινώσεις
        </button>
        <button
          className={tab === "notifications" ? "btn-primary" : "btn-secondary"}
          onClick={() => setTab("notifications")}
        >
          Ειδοποιήσεις {unreadCount > 0 ? `(${unreadCount})` : ""}
        </button>
        <button
          className={tab === "dm" ? "btn-primary" : "btn-secondary"}
          onClick={() => setTab("dm")}
        >
          Μηνύματα (DM)
        </button>
      </div>

      <div className="page-panel">
        {tab === "announcements" && (
          announcements.length === 0 ? (
            <p>Δεν υπάρχουν ανακοινώσεις.</p>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="announcement-item">
                <strong>{a.title}</strong>
                <p style={{ margin: "8px 0 0" }}>{a.message}</p>
                <div className="announcement-meta">
                  {new Date(a.created_at).toLocaleString("el-GR")}
                  {a.author_name ? ` · ${a.author_name}` : ""}
                </div>
              </div>
            ))
          )
        )}

        {tab === "notifications" && (
          notifications.length === 0 ? (
            <p>Δεν υπάρχουν ειδοποιήσεις.</p>
          ) : (
            <table className="page-table">
              <thead>
                <tr>
                  <th>Τίτλος</th>
                  <th>Μήνυμα</th>
                  <th>Ημερομηνία</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} className={n.is_read ? "" : "row-unread"}>
                    <td>{n.title}</td>
                    <td>{n.body}</td>
                    <td>{new Date(n.created_at).toLocaleString("el-GR")}</td>
                    <td>
                      {!n.is_read && (
                        <button className="btn-blue" onClick={() => markRead(n.id)}>
                          Διαβάστηκε
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === "dm" && (
          <div className="dm-layout">
            <div className="dm-contacts">
              <h3>Επαφές</h3>
              {contactsLoading ? (
                <p>{t("loading")}</p>
              ) : contacts.length === 0 ? (
                <p>Δεν βρέθηκαν επαφές.</p>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={
                      activeContact?.id === c.id ? "dm-contact active" : "dm-contact"
                    }
                    onClick={() => setActiveContact(c)}
                  >
                    {c.full_name}
                    <span className="dm-role">{c.role}</span>
                  </button>
                ))
              )}
            </div>
            <div className="dm-chat">
              {!activeContact ? (
                <p>Επίλεξε επαφή για συνομιλία.</p>
              ) : (
                <>
                  <h3>{activeContact.full_name}</h3>
                  <div className="dm-messages">
                    {conversation.map((m) => (
                      <div
                        key={m.id}
                        className={
                          m.sender_id === myId ? "dm-bubble mine" : "dm-bubble theirs"
                        }
                      >
                        <p>{m.content}</p>
                        <span>{new Date(m.created_at).toLocaleString("el-GR")}</span>
                      </div>
                    ))}
                  </div>
                  <div className="dm-compose">
                    <input
                      className="page-input"
                      placeholder="Γράψε μήνυμα..."
                      value={dmText}
                      onChange={(e) => setDmText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendDm()}
                    />
                    <button className="btn-primary" onClick={sendDm}>
                      Αποστολή
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Νέα Ανακοίνωση" onClose={() => setShowAdd(false)}>
          <input
            placeholder="Τίτλος"
            className="modal-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <textarea
            placeholder="Μήνυμα"
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
            <option value="club">Ολόκληρος σύλλογος</option>
            <option value="team">Συγκεκριμένη ομάδα</option>
          </select>
          {form.target_type === "team" && (
            <select
              className="modal-field"
              value={form.target_id}
              onChange={(e) => setForm({ ...form, target_id: e.target.value })}
            >
              <option value="">Επίλεξε ομάδα...</option>
              {teams.map((tm) => (
                <option key={tm.id} value={tm.id}>
                  {tm.name}
                </option>
              ))}
            </select>
          )}
          <button className="btn-primary" onClick={createAnnouncement} style={{ marginRight: 10 }}>
            Δημοσίευση
          </button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>
            {t("cancel")}
          </button>
        </Modal>
      )}
    </div>
  );
}
