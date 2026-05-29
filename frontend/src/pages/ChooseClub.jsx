import { useNavigate, Navigate } from "react-router-dom";
import { getStoredClubs, setActiveClub } from "../utils/club";

export default function ChooseClub() {
  const navigate = useNavigate();
  const clubs = getStoredClubs();

  if (!localStorage.getItem("token")) {
    return <Navigate to="/" replace />;
  }

  const selectClub = (club) => {
    setActiveClub(club);
    navigate("/dashboard");
  };

  if (clubs.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Choose Club</h1>
        <p>No clubs found. Please log in again.</p>
        <button onClick={() => navigate("/")}>Back to Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Choose Club</h1>
      <p>Select which club you want to manage.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
        {clubs.map((club) => (
          <button
            key={club.club_id}
            onClick={() => selectClub(club)}
            style={{
              padding: "16px",
              textAlign: "left",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              background: "white",
              cursor: "pointer",
            }}
          >
            <strong>{club.club_name}</strong>
            <div style={{ color: "#6b7280", marginTop: 4 }}>{club.role}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
