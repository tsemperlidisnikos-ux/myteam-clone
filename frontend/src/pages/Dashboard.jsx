import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { requireClubId, getClubName } from "../utils/club";
import useClubRole from "../hooks/useClubRole";
import Card from "../components/Card";
import { t } from "../i18n/el";
import { getParentTeamIds } from "../utils/parentData";
import "../styles/page.css";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isStaff, isAthlete, isParent, ready } = useClubRole();

  useEffect(() => {
    const load = async () => {
      try {
        const clubId = requireClubId();
        const [statsRes, upRes] = await Promise.all([
          api.get(`/analytics/${clubId}/club`),
          api.get(`/analytics/${clubId}/upcoming?limit=5`),
        ]);
        setStats(statsRes.data);
        let upcomingData = upRes.data;
        if (isParent) {
          const teamIds = await getParentTeamIds(clubId);
          upcomingData = upcomingData.filter((e) => teamIds.has(e.team_id));
        }
        setUpcoming(upcomingData);
      } catch {
        console.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isParent]);

  const record =
    stats?.wins != null && stats?.losses != null
      ? `${stats.wins}W – ${stats.losses}L`
      : "—";

  const eventLink = (e) =>
    e.event_type === "training" ? `/trainings/${e.id}` : `/matches/${e.id}`;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{t("dashboard")}</h1>
          <p className="page-subtitle">
            {t("welcome")} {getClubName()}!
          </p>
        </div>
      </div>

      {loading ? (
        <p>{t("loading")}</p>
      ) : stats ? (
        <>
          {!isAthlete && (
            <div className="stat-grid">
              <Card label={t("athletes")} value={stats.athletes} />
              <Card label={t("coaches")} value={stats.coaches} />
              <Card label={t("teams")} value={stats.teams} />
              <Card label={t("trainings")} value={stats.trainings} />
              <Card label={t("upcoming")} value={stats.upcoming_trainings} suffix={t("sessions")} />
              <Card label={t("matches")} value={stats.matches} />
              <Card label={t("attendance")} value={stats.attendance_rate ?? 0} suffix="%" />
              <Card label={t("record")} value={record} />
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="page-panel" style={{ marginTop: 24 }}>
              <h2>{t("upcoming")}</h2>
              <ul className="calendar-events">
                {upcoming.map((e) => (
                  <li key={`${e.event_type}-${e.id}`} className={`cal-event cal-${e.event_type}`}>
                    <span>{e.event_type === "training" ? "🏀" : "🏆"}</span>
                    <strong>
                      {String(e.date).slice(0, 10)}
                      {e.start_time ? ` ${String(e.start_time).slice(0, 5)}` : ""}
                    </strong>
                    {" — "}
                    {e.team_name}
                    {e.opponent ? ` vs ${e.opponent}` : ""}
                    {" · "}
                    <Link to={eventLink(e)} className="page-link">
                      {t("open")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h2 style={{ marginTop: 32, marginBottom: 12 }}>{t("quickActions")}</h2>
          <div className="quick-actions">
            {!isAthlete && (
              <>
                <Link to="/teams" className="quick-action-card">
                  <strong>{t("teams")}</strong>
                  <span>{t("quickTeamsDesc")}</span>
                </Link>
                <Link to="/athletes" className="quick-action-card">
                  <strong>{t("athletes")}</strong>
                  <span>{t("quickAthletesDesc")}</span>
                </Link>
              </>
            )}
            {isAthlete && (
              <Link to="/my-profile" className="quick-action-card">
                <strong>{t("myProfile")}</strong>
                <span>{t("quickProfileDesc")}</span>
              </Link>
            )}
            <Link to="/trainings" className="quick-action-card">
              <strong>{t("trainings")}</strong>
              <span>{t("quickTrainingsDesc")}</span>
            </Link>
            <Link to="/matches" className="quick-action-card">
              <strong>{t("matches")}</strong>
              <span>{t("quickMatchesDesc")}</span>
            </Link>
            {!isAthlete && (
              <Link to="/analytics" className="quick-action-card">
                <strong>{t("analytics")}</strong>
                <span>{t("quickAnalyticsDesc")}</span>
              </Link>
            )}
            <Link to="/calendar" className="quick-action-card">
              <strong>{t("calendar")}</strong>
              <span>Προπονήσεις & αγώνες</span>
            </Link>
            {ready && isAdmin && (
              <Link to="/staff" className="quick-action-card">
                <strong>{t("staff")}</strong>
                <span>{t("quickStaffDesc")}</span>
              </Link>
            )}
            {ready && isStaff && (
              <Link to="/messages" className="quick-action-card">
                <strong>{t("messages")}</strong>
                <span>{t("quickMessagesDesc")}</span>
              </Link>
            )}
          </div>
        </>
      ) : (
        <p>{t("couldNotLoadStats")}</p>
      )}
    </div>
  );
}
