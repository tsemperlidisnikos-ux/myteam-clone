import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function ParentPortal() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      const clubId = requireClubId();
      const res = await api.get(`/athletes/${clubId}/medical`);
      setRows(res.data.filter((r) => r.parent_name || r.parent_phone));
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>{t("parents")}</h1>
      </div>
      <div className="page-panel">
        <p style={{ marginBottom: 16, color: "#6b7280" }}>
          Επαφές γονέων από προφίλ αθλητών. Μελλοντικά: ξεχωριστός λογαριασμός γονέα.
        </p>
        {rows.length === 0 ? (
          <p>Δεν υπάρχουν στοιχεία γονέων.</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>Αθλητής</th>
                <th>Γονέας</th>
                <th>Τηλέφωνο</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/athletes/${r.id}`} className="page-link">
                      {r.full_name}
                    </Link>
                  </td>
                  <td>{r.parent_name || "—"}</td>
                  <td>{r.parent_phone || "—"}</td>
                  <td>{r.parent_email || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
