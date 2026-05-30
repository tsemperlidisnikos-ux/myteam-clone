import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [devLink, setDevLink] = useState("");

  const submit = async () => {
    try {
      const res = await api.post("/auth/forgot-password", { email });
      showToast(res.data.message, "success");
      if (res.data.reset_url) setDevLink(res.data.reset_url);
    } catch (err) {
      showToast(err.response?.data?.error || "Αποτυχία", "error");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h1>{t("forgotPassword")}</h1>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 12 }}
      />
      <button onClick={submit} style={{ padding: "10px 16px" }}>
        {t("sendResetLink")}
      </button>
      {devLink && (
        <p style={{ marginTop: 16, fontSize: 13 }}>
          Dev link: <Link to={devLink.replace(/^https?:\/\/[^/]+/, "")}>{devLink}</Link>
        </p>
      )}
      <p style={{ marginTop: 16 }}>
        <Link to="/">← Login</Link>
      </p>
    </div>
  );
}
