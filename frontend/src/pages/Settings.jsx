import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function Settings() {
  const { role, isAdmin, ready } = useClubRole();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="page-panel" style={{ maxWidth: 420, marginBottom: 20 }}>
        <h2>Account</h2>
        <p>
          <strong>Role:</strong>{" "}
          {ready ? role || "unknown — try logging out and back in" : "loading…"}
        </p>
        {ready && isAdmin && (
          <Link to="/staff" className="btn-primary" style={{ display: "inline-block", marginTop: 12 }}>
            Manage Staff → Add Coach
          </Link>
        )}
      </div>

      {ready && isAdmin && (
        <div className="page-panel" style={{ maxWidth: 420, marginBottom: 20 }}>
          <h2>{t("billing")}</h2>
          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              try {
                const clubId = requireClubId();
                const res = await api.post(`/billing/${clubId}/checkout`);
                if (res.data.url) window.location.href = res.data.url;
              } catch (err) {
                setError(err.response?.data?.error || "Billing failed");
              }
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {ready && isAdmin && (
        <div className="page-panel" style={{ maxWidth: 420, marginBottom: 20 }}>
          <h2>Club Logo</h2>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const clubId = localStorage.getItem("clubId");
              const fd = new FormData();
              fd.append("logo", file);
              try {
                await api.post(`/clubs/${clubId}/logo`, fd, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
                setMessage("Logo uploaded");
              } catch {
                setError("Logo upload failed");
              }
            }}
          />
        </div>
      )}

      <div className="page-panel" style={{ maxWidth: 420 }}>
        <h2>Change Password</h2>
        <form onSubmit={submit}>
          <input
            type="password"
            className="modal-field"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="modal-field"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="modal-field"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
