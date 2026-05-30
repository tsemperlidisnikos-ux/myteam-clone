import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { showToast } from "../utils/toast";

export default function AcceptInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {
    try {
      await api.post("/auth/accept-invite", {
        token,
        password,
        full_name: fullName,
      });
      showToast("Η πρόσκληση εγινε αποδεκτή", "success");
      navigate("/");
    } catch (err) {
      showToast(err.response?.data?.error || "Αποτυχία", "error");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <h1>Αποδοχή πρόσκλησης</h1>
      <input
        placeholder="Ονοματεπώνυμο"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />
      <input
        type="password"
        placeholder="Κωδικός"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />
      <button onClick={submit} disabled={!token} style={{ padding: "10px 16px" }}>
        Εγγραφή
      </button>
      <p style={{ marginTop: 16 }}>
        <Link to="/">← Login</Link>
      </p>
    </div>
  );
}
