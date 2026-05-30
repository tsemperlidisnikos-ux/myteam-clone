import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import { t } from "../i18n/el";
import { printReport } from "../utils/pdf";
import "../styles/page.css";

function certStatus(expires) {
  if (!expires) return { label: t("noCert"), cls: "badge-gray" };
  const exp = new Date(expires);
  const now = new Date();
  const days = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: t("certExpired"), cls: "badge-red" };
  if (days <= 30) return { label: `${t("certExpiringSoon")} (${days}d)`, cls: "badge-yellow" };
  return { label: exp.toLocaleDateString("el-GR"), cls: "badge-green" };
}

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

  const exportPdf = () => {
    printReport(
      t("medical"),
      [
        { key: "full_name", label: t("athlete") },
        { key: "position", label: t("position") },
        { key: "medical_cert_expires", label: t("certExpiry") },
        { key: "injury_status", label: t("injuryStatus") },
        { key: "medical_notes", label: t("medicalNotes") },
      ],
      rows.map((r) => ({
        ...r,
        medical_cert_expires: r.medical_cert_expires?.slice?.(0, 10) || "—",
        injury_status: r.injury_status || "—",
        medical_notes: r.medical_notes || "—",
        position: r.position || "—",
      }))
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t("medical")}</h1>
        {rows.length > 0 && (
          <button className="btn-secondary" onClick={exportPdf}>
            {t("exportPdf")}
          </button>
        )}
      </div>
      <div className="page-panel">
        {loading ? (
          <p>{t("loading")}</p>
        ) : rows.length === 0 ? (
          <p>{t("noMedicalRecords")}</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>{t("athlete")}</th>
                <th>{t("position")}</th>
                <th>{t("certExpiry")}</th>
                <th>{t("injuryStatus")}</th>
                <th>{t("medicalNotes")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cert = certStatus(r.medical_cert_expires);
                return (
                  <tr key={r.id}>
                    <td>{r.full_name}</td>
                    <td>{r.position || "—"}</td>
                    <td>
                      <span className={`badge ${cert.cls}`}>{cert.label}</span>
                    </td>
                    <td>{r.injury_status || "—"}</td>
                    <td>{r.medical_notes || "—"}</td>
                    <td>
                      <Link to={`/athletes/${r.id}`} className="page-link">
                        {t("profile")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
