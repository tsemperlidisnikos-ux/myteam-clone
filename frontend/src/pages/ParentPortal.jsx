import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function ParentPortal() {
  const [rows, setRows] = useState([]);
  const [links, setLinks] = useState([]);

  useEffect(() => {
    const load = async () => {
      const clubId = requireClubId();
      const [medical, parentLinks] = await Promise.all([
        api.get(`/athletes/${clubId}/medical`),
        api.get(`/parents/${clubId}/links`),
      ]);
      setRows(medical.data.filter((r) => r.parent_name || r.parent_phone));
      setLinks(parentLinks.data);
    };
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>{t("parents")}</h1>
      </div>

      <div className="page-panel" style={{ marginBottom: 16 }}>
        <h2>{t("parentAccounts")}</h2>
        {links.length === 0 ? (
          <p>{t("noParentData")}</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>{t("parent")}</th>
                <th>{t("email")}</th>
                <th>{t("athlete")}</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.id}>
                  <td>{l.parent_name}</td>
                  <td>{l.parent_email}</td>
                  <td>
                    <Link to={`/athletes/${l.athlete_id}`} className="page-link">
                      {l.athlete_name}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="page-panel">
        <p style={{ marginBottom: 16, color: "#6b7280" }}>{t("parentContacts")}</p>
        {rows.length === 0 ? (
          <p>{t("noParentData")}</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>{t("athlete")}</th>
                <th>{t("parent")}</th>
                <th>{t("phone")}</th>
                <th>{t("email")}</th>
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
