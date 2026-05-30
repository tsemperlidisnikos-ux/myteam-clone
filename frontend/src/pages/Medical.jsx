import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function Medical() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const clubId = requireClubId();
        const res = await api.get(`/athletes/${clubId}/medical`);
        setRows(res.data);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>{t("medical")}</h1>
      </div>
      <div className="page-panel">
        {loading ? (
          <p>{t("loading")}</p>
        ) : rows.length === 0 ? (
          <p>Δεν υπάρχουν καταχωρήσεις.</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Αθλητής</th>
                <th>Θέση</th>
                <th>Ιατρικά</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.full_name}</td>
                  <td>{r.position || "—"}</td>
                  <td>{r.medical_notes || "—"}</td>
                  <td>
                    <Link to={`/athletes/${r.id}`} className="page-link">
                      Προφίλ
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
