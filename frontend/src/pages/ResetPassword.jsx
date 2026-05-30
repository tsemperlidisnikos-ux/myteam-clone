import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = async () => {
    if (password !== confirm) {
      showToast("Οι κωδικοί δεν ταιριάζουν", "error");
      return;
    }
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      showToast("Ο κωδικός άλλαξε", "success");
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.error || "Αποτυχία", "error");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h1>{t("resetPassword")}</h1>
      <input
        type="password"
        placeholder="Νέος κωδικός"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 12 }}
      />
      <input
        type="password"
        placeholder="Επιβεβαίωση"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 12 }}
      />
      <button onClick={submit} disabled={!token} style={{ padding: "10px 16px" }}>
        {t("save")}
      </button>
      <p style={{ marginTop: 16 }}>
        <Link to="/">← Login</Link>
      </p>
    </div>
  );
}
