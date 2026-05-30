import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import Modal from "../components/Modal";
import { showToast } from "../utils/toast";
import { t } from "../i18n/el";
import useClubRole from "../hooks/useClubRole";
import { getParentTeamIds } from "../utils/parentData";
import "../styles/page.css";

function monthRange(offset) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  const from = d.toISOString().slice(0, 10);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const to = end.toISOString().slice(0, 10);
  const label = d.toLocaleDateString("el-GR", { month: "long", year: "numeric" });
  const year = d.getFullYear();
  const month = d.getMonth();
  const daysInMonth = end.getDate();
  return { from, to, label, year, month, daysInMonth };
}

function toDayKey(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Calendar() {
  const [offset, setOffset] = useState(0);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const { isParent, isStaff } = useClubRole();
  const [reschedule, setReschedule] = useState(null);
  const [resForm, setResForm] = useState({ date: "", start_time: "", end_time: "", location: "" });

  const range = useMemo(() => monthRange(offset), [offset]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const clubId = requireClubId();
        const res = await api.get(
          `/analytics/${clubId}/calendar?from=${range.from}&to=${range.to}`
        );
        let data = res.data;
        if (isParent) {
          const teamIds = await getParentTeamIds(clubId);
          data = data.filter((e) => teamIds.has(e.team_id));
        }
        setEvents(data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range.from, range.to, isParent]);

  const byDate = useMemo(() => {
    const map = {};
    for (const e of events) {
      const day = toDayKey(e.date);
      if (!map[day]) map[day] = [];
      map[day].push(e);
    }
    return map;
  }, [events]);

  const gridCells = useMemo(() => {
    const firstDow = new Date(range.year, range.month, 1).getDay();
    const startPad = firstDow === 0 ? 6 : firstDow - 1;
    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push({ empty: true, key: `pad-${i}` });
    for (let day = 1; day <= range.daysInMonth; day++) {
      const key = `${range.year}-${String(range.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ day, key, items: byDate[key] || [] });
    }
    return cells;
  }, [range, byDate]);

  const sortedDays = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));

  const openReschedule = (event) => {
    if (event.event_type !== "training") return;
    setReschedule(event);
    setResForm({
      date: toDayKey(event.date),
      start_time: String(event.start_time || "").slice(0, 5),
      end_time: String(event.end_time || "").slice(0, 5),
      location: event.location || "",
    });
  };

  const saveReschedule = async () => {
    try {
      const clubId = requireClubId();
      await api.patch(`/trainings/${clubId}/${reschedule.id}`, resForm);
      setReschedule(null);
      const res = await api.get(
        `/analytics/${clubId}/calendar?from=${range.from}&to=${range.to}`
      );
      setEvents(res.data);
    } catch {
      showToast("Αποτυχία αναπρογραμματισμού", "error");
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t("calendar")}</h1>
        <div className="calendar-nav">
          <button className="btn-secondary" onClick={() => setOffset((o) => o - 1)}>
            ←
          </button>
          <span className="calendar-month">{range.label}</span>
          <button className="btn-secondary" onClick={() => setOffset((o) => o + 1)}>
            →
          </button>
          <button className="btn-secondary" onClick={() => setOffset(0)}>
            {t("today")}
          </button>
          <button
            className={view === "grid" ? "btn-primary" : "btn-secondary"}
            onClick={() => setView("grid")}
          >
            {t("gridView")}
          </button>
          <button
            className={view === "list" ? "btn-primary" : "btn-secondary"}
            onClick={() => setView("list")}
          >
            {t("listView")}
          </button>
        </div>
      </div>

      <div className="page-panel">
        {loading ? (
          <p>{t("loading")}</p>
        ) : view === "grid" ? (
          <>
            <div className="cal-grid-head">
              {["Δε", "Τρ", "Τε", "Πε", "Πα", "Σα", "Κυ"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="cal-grid">
              {gridCells.map((cell) =>
                cell.empty ? (
                  <div key={cell.key} className="cal-cell cal-cell-empty" />
                ) : (
                  <div key={cell.key} className="cal-cell">
                    <div className="cal-cell-day">{cell.day}</div>
                    {cell.items.map((e) => (
                      <Link
                        key={`${e.event_type}-${e.id}`}
                        to={
                          e.event_type === "training"
                            ? `/trainings/${e.id}`
                            : `/matches/${e.id}`
                        }
                        className={`cal-cell-event cal-${e.event_type}`}
                      >
                        {e.event_type === "training" ? "🏀" : "🏆"} {e.team_name}
                      </Link>
                    ))}
                  </div>
                )
              )}
            </div>
          </>
        ) : sortedDays.length === 0 ? (
          <p>{t("noEventsMonth")}</p>
        ) : (
          sortedDays.map(([day, items]) => (
            <div key={day} className="calendar-day">
              <h3>
                {new Date(day + "T12:00:00").toLocaleDateString("el-GR", {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })}
              </h3>
              <ul className="calendar-events">
                {items.map((e) => (
                  <li key={`${e.event_type}-${e.id}`} className={`cal-event cal-${e.event_type}`}>
                    <span className="cal-type">
                      {e.event_type === "training" ? `🏀 ${t("trainingEvent")}` : `🏆 ${t("matchEvent")}`}
                    </span>
                    <strong>{e.team_name}</strong>
                    {e.event_type === "match" && e.opponent && ` vs ${e.opponent}`}
                    {e.start_time && (
                      <span className="cal-time">
                        {" "}
                        · {String(e.start_time).slice(0, 5)}
                        {e.end_time ? `–${String(e.end_time).slice(0, 5)}` : ""}
                      </span>
                    )}
                    {e.location && <span className="cal-loc"> · {e.location}</span>}
                    {" · "}
                    <Link
                      to={
                        e.event_type === "training"
                          ? `/trainings/${e.id}`
                          : `/matches/${e.id}`
                      }
                      className="page-link"
                    >
                      {t("open")}
                    </Link>
                    {isStaff && e.event_type === "training" && (
                      <>
                        {" · "}
                        <button
                          type="button"
                          className="page-link-btn"
                          onClick={() => openReschedule(e)}
                        >
                          {t("reschedule")}
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {reschedule && (
        <Modal title={t("reschedule")} onClose={() => setReschedule(null)}>
          <input
            type="date"
            className="modal-field"
            value={resForm.date}
            onChange={(e) => setResForm({ ...resForm, date: e.target.value })}
          />
          <input
            type="time"
            className="modal-field"
            value={resForm.start_time}
            onChange={(e) => setResForm({ ...resForm, start_time: e.target.value })}
          />
          <input
            type="time"
            className="modal-field"
            value={resForm.end_time}
            onChange={(e) => setResForm({ ...resForm, end_time: e.target.value })}
          />
          <input
            className="modal-field"
            placeholder={t("location")}
            value={resForm.location}
            onChange={(e) => setResForm({ ...resForm, location: e.target.value })}
          />
          <button className="btn-primary" onClick={saveReschedule} style={{ marginRight: 10 }}>
            {t("save")}
          </button>
          <button className="btn-secondary" onClick={() => setReschedule(null)}>
            {t("cancel")}
          </button>
        </Modal>
      )}
    </div>
  );
}
