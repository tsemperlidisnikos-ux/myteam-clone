import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { handleAuthSuccess } from "../utils/auth";

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
          ? "Λάθος email ή password"
          : err.response?.data?.error ||
            (err.code === "ERR_NETWORK"
              ? "Δεν συνδέεται το backend. Τρέξε npm run dev στο backend (port 5000)."
              : "Login failed");
      alert(msg);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h1>Login</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <button onClick={login} style={btnStyle}>Login</button>

      <p style={{ marginTop: 16 }}>
        New club? <Link to="/register">Register Club</Link>
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
