import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function ParentHome() {
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const clubId = requireClubId();
      const res = await api.get(`/parents/${clubId}/children`);
      setChildren(res.data);
      if (res.data[0]) setSelected(res.data[0].id);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const load = async () => {
      const clubId = requireClubId();
      const [tr, mt] = await Promise.all([
        api.get(`/parents/${clubId}/children/${selected}/trainings`),
        api.get(`/parents/${clubId}/children/${selected}/matches`),
      ]);
      setTrainings(tr.data);
      setMatches(mt.data);
    };
    load();
  }, [selected]);

  if (loading) return <p>{t("loading")}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>{t("myChildren")}</h1>
      </div>

      {children.length === 0 ? (
        <div className="page-panel">
          <p>{t("noChildren")}</p>
          <p style={{ color: "#6b7280" }}>{t("selectChild")}</p>
        </div>
      ) : (
        <>
          <div className="page-panel" style={{ marginBottom: 16 }}>
            <label>{t("athlete")}</label>
            <select
              className="modal-field"
              value={selected || ""}
              onChange={(e) => setSelected(Number(e.target.value))}
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                  {c.team_name ? ` (${c.team_name})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="page-panel" style={{ marginBottom: 16 }}>
            <h2>{t("trainings")}</h2>
            {trainings.length === 0 ? (
              <p>—</p>
            ) : (
              <ul>
                {trainings.slice(0, 10).map((tr) => (
                  <li key={tr.id}>
                    {String(tr.date).slice(0, 10)}
                    {tr.start_time ? ` · ${String(tr.start_time).slice(0, 5)}` : ""}
                    {tr.location ? ` · ${tr.location}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="page-panel">
            <h2>{t("matches")}</h2>
            {matches.length === 0 ? (
              <p>—</p>
            ) : (
              <ul>
                {matches.slice(0, 10).map((m) => (
                  <li key={m.id}>
                    {String(m.date).slice(0, 10)} vs {m.opponent}
                    {m.our_score != null ? ` (${m.our_score}–${m.opponent_score})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
