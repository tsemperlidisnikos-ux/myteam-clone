import { useEffect, useState } from "react";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function Fees() {
  const { isAdmin } = useClubRole();
  const { teams } = useTeams();
  const [rows, setRows] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    athlete_user_id: "",
    amount_eur: "30",
    period_label: "",
  });

  const load = async () => {
    const clubId = requireClubId();
    const [pRes, aRes] = await Promise.all([
      api.get(`/payments/${clubId}`),
      api.get(`/athletes/${clubId}`),
    ]);
    setRows(pRes.data);
    setAthletes(aRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const createFee = async () => {
    try {
      const clubId = requireClubId();
      await api.post(`/payments/${clubId}`, {
        athlete_user_id: Number(form.athlete_user_id),
        amount_cents: Math.round(Number(form.amount_eur) * 100),
        period_label: form.period_label || t("membershipFee"),
      });
      setShowAdd(false);
      load();
    } catch {
      showToast(t("feeCreateFailed"), "error");
    }
  };

  const pay = async (id) => {
    try {
      const clubId = requireClubId();
      const res = await api.post(`/payments/${clubId}/${id}/checkout`);
      if (res.data.url) window.location.href = res.data.url;
    } catch (err) {
      showToast(err.response?.data?.error || t("billingFailed"), "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t("fees")}</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            + {t("newFee")}
          </button>
        )}
      </div>
      <div className="page-panel">
        {rows.length === 0 ? (
          <p>{t("noFees")}</p>
        ) : (
          <table className="page-table">
            <thead>
              <tr>
                <th>{t("athlete")}</th>
                <th>{t("period")}</th>
                <th>{t("amount")}</th>
                <th>{t("status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.athlete_name}</td>
                  <td>{r.period_label || "—"}</td>
                  <td>{(r.amount_cents / 100).toFixed(2)} {r.currency}</td>
                  <td>{r.status === "paid" ? t("paid") : t("pending")}</td>
                  <td>
                    {r.status !== "paid" && (
                      <button className="btn-blue" onClick={() => pay(r.id)}>
                        {t("payNow")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <Modal title={t("newFee")} onClose={() => setShowAdd(false)}>
          <select
            className="modal-field"
            value={form.athlete_user_id}
            onChange={(e) => setForm({ ...form, athlete_user_id: e.target.value })}
          >
            <option value="">{t("selectAthlete")}</option>
            {athletes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
          <input
            className="modal-field"
            type="number"
            min="0"
            step="0.01"
            placeholder={t("amountEur")}
            value={form.amount_eur}
            onChange={(e) => setForm({ ...form, amount_eur: e.target.value })}
          />
          <input
            className="modal-field"
            placeholder={t("period")}
            value={form.period_label}
            onChange={(e) => setForm({ ...form, period_label: e.target.value })}
          />
          <button className="btn-primary" onClick={createFee} style={{ marginRight: 10 }}>
            {t("save")}
          </button>
          <button className="btn-secondary" onClick={() => setShowAdd(false)}>
            {t("cancel")}
          </button>
        </Modal>
      )}
    </div>
  );
}
