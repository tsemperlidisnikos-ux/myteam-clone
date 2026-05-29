import { pool } from "../db/pool.js";

// CREATE match
export const createMatch = async (req, res) => {
  const { clubId } = req.params;
  const { team_id, opponent, date, start_time, location, competition, notes } = req.body;

  const result = await pool.query(
    `INSERT INTO matches
     (club_id, team_id, opponent, date, start_time, location, competition, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [clubId, team_id, opponent, date, start_time, location, competition, notes]
  );

  res.json(result.rows[0]);
};

// GET matches for a team
export const getMatches = async (req, res) => {
  const { clubId } = req.params;
  const { team_id } = req.query;

  const result = await pool.query(
    `SELECT *
     FROM matches
     WHERE club_id = $1 AND team_id = $2
     ORDER BY date DESC`,
    [clubId, team_id]
  );

  res.json(result.rows);
};

// GET match details
export const getMatchDetails = async (req, res) => {
  const { matchId } = req.params;

  const result = await pool.query(
    `SELECT *
     FROM matches
     WHERE id = $1`,
    [matchId]
  );

  res.json(result.rows[0]);
};

// UPDATE match (score, details)
export const updateMatch = async (req, res) => {
  const { clubId, matchId } = req.params;
  const {
    opponent,
    date,
    start_time,
    location,
    competition,
    our_score,
    opponent_score,
    notes
  } = req.body;

  const result = await pool.query(
    `UPDATE matches
     SET opponent = COALESCE($1, opponent),
         date = COALESCE($2, date),
         start_time = COALESCE($3, start_time),
         location = COALESCE($4, location),
         competition = COALESCE($5, competition),
         our_score = COALESCE($6, our_score),
         opponent_score = COALESCE($7, opponent_score),
         notes = COALESCE($8, notes),
         updated_at = NOW()
     WHERE id = $9 AND club_id = $10
     RETURNING *`,
    [
      opponent,
      date,
      start_time,
      location,
      competition,
      our_score,
      opponent_score,
      notes,
      matchId,
      clubId
    ]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Match not found" });
  }

  res.json(result.rows[0]);
};

// SET match stats for an athlete
export const setMatchStats = async (req, res) => {
  const { matchId } = req.params;
  const {
    athlete_id,
    points,
    rebounds,
    assists,
    steals,
    blocks,
    turnovers,
    fouls,
    minutes_played
  } = req.body;

  const result = await pool.query(
    `INSERT INTO match_stats
     (match_id, athlete_id, points, rebounds, assists, steals, blocks, turnovers, fouls, minutes_played)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (match_id, athlete_id)
     DO UPDATE SET
       points = EXCLUDED.points,
       rebounds = EXCLUDED.rebounds,
       assists = EXCLUDED.assists,
       steals = EXCLUDED.steals,
       blocks = EXCLUDED.blocks,
       turnovers = EXCLUDED.turnovers,
       fouls = EXCLUDED.fouls,
       minutes_played = EXCLUDED.minutes_played
     RETURNING *`,
    [
      matchId,
      athlete_id,
      points,
      rebounds,
      assists,
      steals,
      blocks,
      turnovers,
      fouls,
      minutes_played
    ]
  );

  res.json(result.rows[0]);
};

// GET match stats
export const getMatchStats = async (req, res) => {
  const { matchId } = req.params;

  const result = await pool.query(
    `SELECT u.full_name, u.id AS athlete_id,
            ms.points, ms.rebounds, ms.assists,
            ms.steals, ms.blocks, ms.turnovers,
            ms.fouls, ms.minutes_played
     FROM match_stats ms
     JOIN users u ON u.id = ms.athlete_id
     WHERE ms.match_id = $1
     ORDER BY u.full_name`,
    [matchId]
  );

  res.json(result.rows);
};

// ADD match event (optional)
export const addMatchEvent = async (req, res) => {
  const { matchId } = req.params;
  const { athlete_id, event_type, value, minute } = req.body;

  const result = await pool.query(
    `INSERT INTO match_events
     (match_id, athlete_id, event_type, value, minute)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [matchId, athlete_id, event_type, value, minute]
  );

  res.json(result.rows[0]);
};

// GET match events
export const getMatchEvents = async (req, res) => {
  const { matchId } = req.params;

  const result = await pool.query(
    `SELECT me.*, u.full_name
     FROM match_events me
     LEFT JOIN users u ON u.id = me.athlete_id
     WHERE me.match_id = $1
     ORDER BY minute ASC`,
    [matchId]
  );

  res.json(result.rows);
};
