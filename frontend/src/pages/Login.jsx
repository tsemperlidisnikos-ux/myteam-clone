import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { handleAuthSuccess } from "../utils/auth";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const res = await api.post("/auth/login", { email, password });
      handleAuthSuccess(res.data, navigate);
    } catch (err) {
      const msg =
        err.response?.data?.error === "Invalid credentials"
          ? t("invalidCredentials")
          : err.response?.data?.error ||
            (err.code === "ERR_NETWORK" ? t("networkError") : "Login failed");
      showToast(msg, "error");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h1>{t("login")}</h1>

      <input
        placeholder={t("email")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder={t("password")}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <button onClick={login} style={btnStyle}>
        {t("login")}
      </button>

      <p style={{ marginTop: 12 }}>
        <Link to="/forgot-password">{t("forgotPassword")}</Link>
      </p>
      <p style={{ marginTop: 16 }}>
        {t("newClub")} <Link to="/register">{t("registerClub")}</Link>
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
};
