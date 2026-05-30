import { Navigate } from "react-router-dom";
import useClubRole from "../hooks/useClubRole";

export default function AdminRoute({ children }) {
  const { isAdmin, ready } = useClubRole();

  if (!ready) {
    return <p>Loading...</p>;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
