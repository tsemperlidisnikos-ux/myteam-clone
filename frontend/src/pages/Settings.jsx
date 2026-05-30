import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import { t, roleLabel } from "../i18n/el";
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
      setError(t("passwordMin6"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("passwordsNoMatch"));
      return;
    }

    setSaving(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setMessage(t("passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.error || t("failedChangePassword"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t("settings")}</h1>
      </div>

      <div className="page-panel" style={{ maxWidth: 420, marginBottom: 20 }}>
        <h2>{t("account")}</h2>
        <p>
          <strong>{t("role")}:</strong>{" "}
          {ready ? roleLabel(role) || t("roleUnknown") : t("loading")}
        </p>
        {ready && isAdmin && (
          <Link to="/staff" className="btn-primary" style={{ display: "inline-block", marginTop: 12 }}>
            {t("manageStaff")} →
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
                setError(err.response?.data?.error || t("billingFailed"));
              }
            }}
          >
            {t("upgradePro")}
          </button>
        </div>
      )}

      {ready && isAdmin && (
        <div className="page-panel" style={{ maxWidth: 420, marginBottom: 20 }}>
          <h2>{t("clubLogo")}</h2>
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
                setMessage(t("logoUploaded"));
              } catch {
                setError(t("logoUploadFailed"));
              }
            }}
          />
        </div>
      )}

      <div className="page-panel" style={{ maxWidth: 420 }}>
        <h2>{t("changePassword")}</h2>
        <form onSubmit={submit}>
          <input
            type="password"
            className="modal-field"
            placeholder={t("currentPassword")}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="modal-field"
            placeholder={t("newPassword")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="modal-field"
            placeholder={t("confirmPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t("saving") : t("updatePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
