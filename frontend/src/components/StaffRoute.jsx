import { Navigate } from "react-router-dom";
import useClubRole from "../hooks/useClubRole";

export default function StaffRoute({ children }) {
  const { isStaff, ready } = useClubRole();

  if (!ready) return <p>Φόρτωση...</p>;
  if (!isStaff) return <Navigate to="/dashboard" replace />;
  return children;
}
