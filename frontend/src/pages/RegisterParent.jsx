import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { handleAuthSuccess } from "../utils/auth";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";

export default function RegisterParent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      showToast(t("passwordMin6"), "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/register-parent", {
        code: code.trim(),
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
      handleAuthSuccess(res.data, navigate);
      showToast(t("registrationSuccess"), "success");
    } catch (err) {
      showToast(err.response?.data?.error || t("registrationFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h1>{t("registerParent")}</h1>
      <p style={{ color: "#6b7280", marginBottom: 20 }}>{t("parentCodeHint")}</p>

      <form onSubmit={submit}>
        <input
          placeholder={t("parentCode")}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={inputStyle}
          required
        />
        <input
          placeholder={t("fullName")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={inputStyle}
          required
        />
        <input
          placeholder={t("email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
        />
        <input
          placeholder={t("passwordMin")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
        />
        <button type="submit" style={btnStyle} disabled={loading}>
          {loading ? t("saving") : t("register")}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        <Link to="/">{t("backToLogin")}</Link>
      </p>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "8px",
  marginBottom: 10,
  borderRadius: 6,
  border: "1px solid #d1d5db",
};

const btnStyle = {
  padding: "10px 16px",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  width: "100%",
};
