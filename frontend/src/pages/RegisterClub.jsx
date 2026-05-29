import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { handleAuthSuccess } from "../utils/auth";

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
        (err.code === "ERR_NETWORK"
          ? "Cannot reach backend. Is npm run dev running on port 5000?"
          : "Registration failed");
      alert(msg);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h1>Register Club</h1>

      <input placeholder="Full name" value={form.full_name} onChange={update("full_name")} style={inputStyle} />
      <input placeholder="Email" value={form.email} onChange={update("email")} style={inputStyle} />
      <input placeholder="Password" type="password" value={form.password} onChange={update("password")} style={inputStyle} />
      <input placeholder="Club name" value={form.club_name} onChange={update("club_name")} style={inputStyle} />
      <input placeholder="Country" value={form.country} onChange={update("country")} style={inputStyle} />
      <input placeholder="City" value={form.city} onChange={update("city")} style={inputStyle} />

      <button onClick={register} style={btnStyle}>Create Club</button>
      <p style={{ marginTop: 16 }}>
        Already have an account? <Link to="/">Login</Link>
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
