import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import { t } from "../i18n/el";

export default function MyProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const clubId = requireClubId();
        const res = await api.get(`/athletes/${clubId}/me`);
        navigate(`/athletes/${res.data.id}`, { replace: true });
      } catch {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  if (loading) return <p>{t("loading")}</p>;
  return <p>Δεν βρέθηκε προφίλ αθλητή.</p>;
}
