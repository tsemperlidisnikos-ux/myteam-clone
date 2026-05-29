import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";
import { requireClubId } from "../utils/club";
import { showToast } from "../utils/toast";
import "../styles/page.css";

const STAT_FIELDS = [
  { key: "minutes_played", label: "MIN", short: true },
  { key: "points", label: "PTS", short: true },
  { key: "rebounds", label: "REB", short: true },
  { key: "assists", label: "AST", short: true },
  { key: "steals", label: "STL", short: true },
  { key: "blocks", label: "BLK", short: true },
  { key: "turnovers", label: "TO", short: true },
  { key: "fouls", label: "PF", short: true },
];

const emptyStats = () => ({
  minutes_played: 0,
  points: 0,
  rebounds: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0,
});

export default function MatchDetail() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [roster, setRoster] = useState([]);
  const [statRows, setStatRows] = useState({});
  const [scoreForm, setScoreForm] = useState({ our_score: "", opponent_score: "" });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savingAll, setSavingAll] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const clubId = requireClubId();
      const matchRes = await api.get(`/matches/${clubId}/${matchId}`);
      const m = matchRes.data;
      if (!m) {
        setMatch(null);
        return;
      }

      const [statsRes, teamRes] = await Promise.all([
        api.get(`/matches/${clubId}/${matchId}/stats`),
        api.get(`/teams/${clubId}/${m.team_id}`),
      ]);

      setMatch(m);
      setRoster(teamRes.data.athletes || []);
      setScoreForm({
        our_score: m.our_score ?? "",
        opponent_score: m.opponent_score ?? "",
      });

      const statsMap = {};
      for (const s of statsRes.data) {
        statsMap[s.athlete_id] = {
          minutes_played: s.minutes_played ?? 0,
          points: s.points ?? 0,
          rebounds: s.rebounds ?? 0,
          assists: s.assists ?? 0,
          steals: s.steals ?? 0,
          blocks: s.blocks ?? 0,
          turnovers: s.turnovers ?? 0,
          fouls: s.fouls ?? 0,
        };
      }

      const rows = {};
      for (const a of teamRes.data.athletes || []) {
        rows[a.id] = statsMap[a.id] || emptyStats();
      }
      setStatRows(rows);
    } catch {
      showToast("Failed to load match", "error");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStat = (athleteId, key, value) => {
    setStatRows((prev) => ({
      ...prev,
      [athleteId]: { ...prev[athleteId], [key]: value === "" ? 0 : Number(value) },
    }));
  };

  const saveStats = async (athleteId) => {
    setSavingId(athleteId);
    setMessage("");
    try {
      const clubId = requireClubId();
      await api.post(`/matches/${clubId}/${matchId}/stats`, {
        athlete_id: athleteId,
        ...statRows[athleteId],
      });
      showToast("Stats saved.", "success");
    } catch {
      showToast("Failed to save stats", "error");
    } finally {
      setSavingId(null);
    }
  };

  const saveAllStats = async () => {
    setSavingAll(true);
    setMessage("");
    try {
      const clubId = requireClubId();
      await Promise.all(
        Object.entries(statRows).map(([athleteId, stats]) =>
          api.post(`/matches/${clubId}/${matchId}/stats`, {
            athlete_id: Number(athleteId),
            ...stats,
          })
        )
      );
      showToast("All stats saved.", "success");
      load();
    } catch {
      showToast("Failed to save stats", "error");
    } finally {
      setSavingAll(false);
    }
  };

  const saveScore = async () => {
    try {
      const clubId = requireClubId();
      await api.put(`/matches/${clubId}/${matchId}`, {
        our_score: scoreForm.our_score === "" ? null : Number(scoreForm.our_score),
        opponent_score:
          scoreForm.opponent_score === "" ? null : Number(scoreForm.opponent_score),
      });
      showToast("Score updated.", "success");
      load();
    } catch {
      showToast("Failed to update score", "error");
    }
  };

  if (loading) {
    return <p>Loading match...</p>;
  }

  if (!match) {
    return (
      <div>
        <Link to="/matches" className="page-back">
          ← Back to Matches
        </Link>
        <p>Match not found.</p>
      </div>
    );
  }

  const dateStr = match.date?.slice?.(0, 10) ?? match.date;
  const rosterIds = Object.keys(statRows);

  return (
    <div>
      <Link to="/matches" className="page-back">
        ← Back to Matches
      </Link>

      <div className="page-header">
        <h1>
          vs {match.opponent}
        </h1>
      </div>

      <div className="page-panel detail-meta">
        <p>
          <strong>Date:</strong> {dateStr}
          {match.start_time ? ` · ${match.start_time.slice?.(0, 5) ?? match.start_time}` : ""}
        </p>
        <p>
          <strong>Competition:</strong> {match.competition || "—"}
        </p>
        <p>
          <strong>Location:</strong> {match.location || "—"}
        </p>
        {match.notes && (
          <p>
            <strong>Notes:</strong> {match.notes}
          </p>
        )}
      </div>

      <div className="page-panel score-panel">
        <h2>Score</h2>
        <div className="score-form">
          <label>
            Us
            <input
              type="number"
              min="0"
              className="stats-input score-input"
              value={scoreForm.our_score}
              onChange={(e) => setScoreForm({ ...scoreForm, our_score: e.target.value })}
            />
          </label>
          <span className="score-sep">–</span>
          <label>
            Them
            <input
              type="number"
              min="0"
              className="stats-input score-input"
              value={scoreForm.opponent_score}
              onChange={(e) =>
                setScoreForm({ ...scoreForm, opponent_score: e.target.value })
              }
            />
          </label>
          <button className="btn-primary" onClick={saveScore}>
            Update Score
          </button>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: 24 }}>
        <h2>Player Stats</h2>
        {rosterIds.length > 0 && (
          <button className="btn-primary" onClick={saveAllStats} disabled={savingAll}>
            {savingAll ? "Saving..." : "Save All"}
          </button>
        )}
      </div>

      {message && <p className="form-success">{message}</p>}

      <div className="page-panel stats-panel">
        {roster.length === 0 ? (
          <p>
            No athletes on this team&apos;s roster.{" "}
            <Link to={`/teams/${match.team_id}`} className="page-link">
              Add athletes to the team
            </Link>{" "}
            first.
          </p>
        ) : (
          <div className="stats-table-wrap">
            <table className="page-table stats-table">
              <thead>
                <tr>
                  <th>Player</th>
                  {STAT_FIELDS.map((f) => (
                    <th key={f.key} className="stats-th">
                      {f.label}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {roster.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link to={`/athletes/${a.id}`} className="page-link">
                        {a.full_name}
                      </Link>
                    </td>
                    {STAT_FIELDS.map((f) => (
                      <td key={f.key}>
                        <input
                          type="number"
                          min="0"
                          className="stats-input"
                          value={statRows[a.id]?.[f.key] ?? 0}
                          onChange={(e) => updateStat(a.id, f.key, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>
                      <button
                        className="btn-blue"
                        onClick={() => saveStats(a.id)}
                        disabled={savingId === a.id}
                      >
                        {savingId === a.id ? "..." : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
