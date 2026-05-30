import { useEffect, useState } from "react";
import { getClubRole, refreshClubRole, syncClubRoleFromStorage } from "../utils/club";

export default function useClubRole() {
  const [role, setRole] = useState(() => syncClubRoleFromStorage() || getClubRole());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    refreshClubRole().then((r) => {
      if (active) {
        setRole(r || getClubRole());
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return {
    role,
    ready,
    isAdmin: role === "admin",
    isStaff: role === "admin" || role === "coach",
    isAthlete: role === "athlete",
  };
}
