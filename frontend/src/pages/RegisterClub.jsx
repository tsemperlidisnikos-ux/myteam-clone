import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { handleAuthSuccess } from "../utils/auth";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";

export default function RegisterClub() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    club_name: "",
    country: "",
    city: "",
  });

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const register = async () => {
    try {
      const res = await api.post("/auth/register-club", form);
      handleAuthSuccess(res.data, navigate);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        (err.code === "ERR_NETWORK" ? t("networkError") : "Registration failed");
      showToast(msg, "error");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h1>{t("registerClub")}</h1>

      <input placeholder={t("fullName")} value={form.full_name} onChange={update("full_name")} style={inputStyle} />
      <input placeholder={t("email")} value={form.email} onChange={update("email")} style={inputStyle} />
      <input placeholder={t("password")} type="password" value={form.password} onChange={update("password")} style={inputStyle} />
      <input placeholder={t("clubName")} value={form.club_name} onChange={update("club_name")} style={inputStyle} />
      <input placeholder={t("country")} value={form.country} onChange={update("country")} style={inputStyle} />
      <input placeholder={t("city")} value={form.city} onChange={update("city")} style={inputStyle} />

      <button onClick={register} style={btnStyle}>{t("create")}</button>
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
};
