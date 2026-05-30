import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useTeams from "../hooks/useTeams";
import Card from "../components/Card";
import { downloadCsv } from "../utils/csv";
import { t } from "../i18n/el";
import "../styles/page.css";

export default function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clubStats, setClubStats] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
  const [trainingTrend, setTrainingTrend] = useState([]);
  const [matchTrend, setMatchTrend] = useState([]);
  const { teams, loading: teamsLoading } = useTeams();
  const [teamId, setTeamId] = useState(searchParams.get("team") || "");

  useEffect(() => {
    const loadClub = async () => {
      try {
        const clubId = requireClubId();
        const res = await api.get(`/analytics/${clubId}/club`);
        setClubStats(res.data);
      } catch {
        console.error("Failed to load club analytics");
      }
    };
    loadClub();
  }, []);

  useEffect(() => {
    if (teams.length > 0 && !teamId) {
      setTeamId(String(teams[0].id));
    }
  }, [teams, teamId]);

  useEffect(() => {
    if (!teamId) return;
    const loadTeam = async () => {
      try {
        const clubId = requireClubId();
        const [statsRes, trainRes, matchRes] = await Promise.all([
          api.get(`/analytics/${clubId}/team/${teamId}`),
          api.get(`/analytics/${clubId}/team/${teamId}/trainings`),
          api.get(`/analytics/${clubId}/team/${teamId}/matches`),
        ]);
        setTeamStats(statsRes.data);
        setTrainingTrend(trainRes.data);
        setMatchTrend(matchRes.data);
      } catch {
        console.error("Failed to load team analytics");
      }
    };
    loadTeam();
  }, [teamId]);

  const onTeamChange = (id) => {
    setTeamId(id);
    if (id) setSearchParams({ team: id });
    else setSearchParams({});
  };

  const exportClubCsv = () => {
    if (!clubStats) return;
    downloadCsv("club-stats.csv", [
      {
        athletes: clubStats.athletes,
        coaches: clubStats.coaches,
        teams: clubStats.teams,
        trainings: clubStats.trainings,
        attendance_rate: clubStats.attendance_rate,
        wins: clubStats.wins,
        losses: clubStats.losses,
      },
    ]);
  };

  const exportScorersCsv = () => {
    if (!teamStats?.top_scorers?.length) return;
    downloadCsv("top-scorers.csv", teamStats.top_scorers.map((p) => ({
      player: p.full_name,
      ppg: Number(p.ppg).toFixed(1),
    })));
  };

  return (
    <div>
      <div className="page-header">
        <h1>{t("analytics")}</h1>
        {clubStats && (
          <button className="btn-secondary" onClick={exportClubCsv}>
            {t("export")}
          </button>
        )}
      </div>

      <h2 style={{ marginBottom: 12 }}>{t("clubOverview")}</h2>
      {clubStats ? (
        <div className="stat-grid" style={{ marginBottom: 32 }}>
          <Card label={t("athletes")} value={clubStats.athletes} />
          <Card label={t("coaches")} value={clubStats.coaches} />
          <Card label={t("teams")} value={clubStats.teams} />
          <Card label={t("trainings")} value={clubStats.trainings} />
          <Card label={t("attendance")} value={clubStats.attendance_rate ?? 0} suffix="%" />
          <Card label={t("wins")} value={clubStats.wins ?? 0} />
          <Card label={t("losses")} value={clubStats.losses ?? 0} />
        </div>
      ) : (
        <p>{t("loadingClubStats")}</p>
      )}

      <div className="page-header" style={{ marginBottom: 12 }}>
        <h2>{t("teamStats")}</h2>
        {teamId && (
          <Link to={`/teams/${teamId}`} className="btn-secondary">
            {t("openTeam")}
          </Link>
        )}
      </div>

      <div className="page-toolbar">
        <select
          className="page-select"
          value={teamId}
          onChange={(e) => onTeamChange(e.target.value)}
          disabled={teamsLoading}
        >
          {teams.length === 0 ? (
            <option value="">{t("noTeams")}</option>
          ) : (
            teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))
          )}
        </select>
      </div>

      {teamStats ? (
        <>
          {teamStats.team && (
            <p className="page-subtitle" style={{ marginBottom: 16 }}>
              {teamStats.team.name}
              {teamStats.team.category ? ` · ${teamStats.team.category}` : ""}
            </p>
          )}

          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <Card label={t("roster")} value={teamStats.roster_size ?? 0} />
            <Card label={t("trainings")} value={teamStats.trainings ?? 0} />
            <Card label={t("attendance")} value={teamStats.attendance_rate ?? 0} suffix="%" />
            <Card label={t("wins")} value={teamStats.wins ?? 0} />
            <Card label={t("losses")} value={teamStats.losses ?? 0} />
            <Card label={t("avgPoints")} value={Number(teamStats.averages?.avg_points ?? 0).toFixed(1)} />
            <Card label={t("avgRebounds")} value={Number(teamStats.averages?.avg_rebounds ?? 0).toFixed(1)} />
            <Card label={t("avgAssists")} value={Number(teamStats.averages?.avg_assists ?? 0).toFixed(1)} />
          </div>

          {teamStats.top_scorers?.length > 0 ? (
            <div className="page-panel">
              <div className="section-header">
                <h3>{t("topScorers")}</h3>
                <button className="btn-secondary btn-sm" onClick={exportScorersCsv}>
                  {t("export")}
                </button>
              </div>
              <table className="page-table">
                <thead>
                  <tr>
                    <th>{t("player")}</th>
                    <th>PPG</th>
                  </tr>
                </thead>
                <tbody>
                  {teamStats.top_scorers.map((p) => (
                    <tr key={p.athlete_id || p.full_name}>
                      <td>
                        {p.athlete_id ? (
                          <Link to={`/athletes/${p.athlete_id}`} className="page-link">
                            {p.full_name}
                          </Link>
                        ) : (
                          p.full_name
                        )}
                      </td>
                      <td>{Number(p.ppg).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="page-panel">
              <p>{t("noMatchStatsYet")}</p>
            </div>
          )}

          <div className="detail-grid" style={{ marginTop: 20 }}>
            <div className="page-panel">
              <h3>{t("attendanceTrend")}</h3>
              {trainingTrend.length === 0 ? (
                <p>{t("noAttendanceData")}</p>
              ) : (
                <ul className="trend-list">
                  {trainingTrend.map((row) => (
                    <li key={row.month} className="trend-item">
                      <span className="trend-label">
                        {new Date(row.month).toLocaleDateString(undefined, {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <div className="trend-bar-wrap">
                        <div
                          className="trend-bar trend-bar-green"
                          style={{ width: `${Math.min(row.attendance_rate || 0, 100)}%` }}
                        />
                      </div>
                      <span className="trend-value">{row.attendance_rate ?? 0}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="page-panel">
              <h3>{t("matchScores")}</h3>
              {matchTrend.length === 0 ? (
                <p>{t("noMatchResults")}</p>
              ) : (
                <ul className="trend-list">
                  {matchTrend.map((row, i) => (
                    <li key={`${row.date}-${i}`} className="trend-item">
                      <span className="trend-label">
                        {row.date?.slice?.(0, 10) ?? row.date}
                      </span>
                      <div className="trend-bar-wrap">
                        <div
                          className="trend-bar trend-bar-blue"
                          style={{
                            width: `${Math.min((row.our_score || 0) * 1.2, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="trend-value">{row.our_score ?? 0} pts</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : (
        <p>{teams.length === 0 ? t("createTeamFirst") : t("selectTeamStats")}</p>
      )}
    </div>
  );
}
