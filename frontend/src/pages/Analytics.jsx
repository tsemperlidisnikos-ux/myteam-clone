import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import useTeams from "../hooks/useTeams";
import Card from "../components/Card";
import "../styles/page.css";

export default function Analytics() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clubStats, setClubStats] = useState(null);
  const [teamStats, setTeamStats] = useState(null);
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
        const res = await api.get(`/analytics/${clubId}/team/${teamId}`);
        setTeamStats(res.data);
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

  return (
    <div>
      <h1 style={{ marginBottom: 20 }}>Analytics</h1>

      <h2 style={{ marginBottom: 12 }}>Club Overview</h2>
      {clubStats ? (
        <div className="stat-grid" style={{ marginBottom: 32 }}>
          <Card label="Athletes" value={clubStats.athletes} />
          <Card label="Coaches" value={clubStats.coaches} />
          <Card label="Teams" value={clubStats.teams} />
          <Card label="Trainings" value={clubStats.trainings} />
          <Card label="Attendance" value={clubStats.attendance_rate ?? 0} suffix="%" />
          <Card label="Wins" value={clubStats.wins ?? 0} />
          <Card label="Losses" value={clubStats.losses ?? 0} />
        </div>
      ) : (
        <p>Loading club stats...</p>
      )}

      <div className="page-header" style={{ marginBottom: 12 }}>
        <h2>Team Stats</h2>
        {teamId && (
          <Link to={`/teams/${teamId}`} className="btn-secondary">
            Open Team
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
            <option value="">No teams</option>
          ) : (
            teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
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
            <Card label="Roster" value={teamStats.roster_size ?? 0} />
            <Card label="Trainings" value={teamStats.trainings ?? 0} />
            <Card label="Attendance" value={teamStats.attendance_rate ?? 0} suffix="%" />
            <Card label="Wins" value={teamStats.wins ?? 0} />
            <Card label="Losses" value={teamStats.losses ?? 0} />
            <Card label="Avg Points" value={Number(teamStats.averages?.avg_points ?? 0).toFixed(1)} />
            <Card label="Avg Rebounds" value={Number(teamStats.averages?.avg_rebounds ?? 0).toFixed(1)} />
            <Card label="Avg Assists" value={Number(teamStats.averages?.avg_assists ?? 0).toFixed(1)} />
          </div>

          {teamStats.top_scorers?.length > 0 ? (
            <div className="page-panel">
              <h3>Top Scorers</h3>
              <table className="page-table">
                <thead>
                  <tr>
                    <th>Player</th>
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
              <p>No match stats yet. Add matches and player stats to see top scorers.</p>
            </div>
          )}
        </>
      ) : (
        <p>{teams.length === 0 ? "Create a team first." : "Select a team to view stats."}</p>
      )}
    </div>
  );
}
