import { Navigate } from "react-router-dom";
import { isAdmin } from "../utils/club";

export default function AdminRoute({ children }) {
  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
