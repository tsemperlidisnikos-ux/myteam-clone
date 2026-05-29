import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const clubId = localStorage.getItem("clubId");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (!clubId) {
    return <Navigate to="/choose-club" replace />;
  }

  return children;
}
