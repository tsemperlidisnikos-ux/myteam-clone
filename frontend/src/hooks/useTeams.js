import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId } from "../utils/club";

export default function useTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const clubId = requireClubId();
        const res = await api.get(`/teams/${clubId}`);
        setTeams(res.data);
      } catch (err) {
        console.error("Failed to load teams", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { teams, loading };
}
