import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import { t } from "../i18n/el";

export default function AthleteProfileRoute({ children }) {
  const { athleteId } = useParams();
  const { isStaff, isAthlete, isParent, ready } = useClubRole();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (!ready) return;

    if (isStaff) {
      setAllowed(true);
      return;
    }

    if (isAthlete) {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setAllowed(String(user.id) === String(athleteId));
      } catch {
        setAllowed(false);
      }
      return;
    }

    if (isParent) {
      const check = async () => {
        try {
          const clubId = requireClubId();
          const res = await api.get(`/parents/${clubId}/children`);
          setAllowed(res.data.some((c) => String(c.athlete_user_id) === String(athleteId)));
        } catch {
          setAllowed(false);
        }
      };
      check();
      return;
    }

    setAllowed(false);
  }, [ready, isStaff, isAthlete, isParent, athleteId]);

  if (!ready || allowed === null) return <p>{t("loading")}</p>;
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return children;
}
