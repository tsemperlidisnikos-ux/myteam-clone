import { pool } from "../db/pool.js";

async function getParentTeamIds(userId, clubId) {
  const result = await pool.query(
    `SELECT DISTINCT ta.team_id AS id
     FROM parent_athletes pa
     JOIN athlete_profiles ap ON ap.id = pa.athlete_id
     JOIN team_athletes ta ON ta.user_id = ap.user_id
     JOIN teams t ON t.id = ta.team_id AND t.club_id = $2
     WHERE pa.user_id = $1 AND pa.club_id = $2`,
    [userId, clubId]
  );
  return result.rows.map((r) => r.id);
}

//
// CLUB ANALYTICS
//
export const getClubAnalytics = async (req, res) => {
  const { clubId } = req.params;
  const role = req.user.role;
  const userId = req.user.user_id;

  if (role === "parent") {
    const teamIds = await getParentTeamIds(userId, clubId);
    if (!teamIds.length) {
      return res.json({
        athletes: 0,
        coaches: 0,
        teams: 0,
        trainings: 0,
        upcoming_trainings: 0,
        matches: 0,
        attendance_rate: 0,
        wins: 0,
        losses: 0,
        linked_children: 0,
      });
    }

    const children = await pool.query(
      `SELECT COUNT(*) FROM parent_athletes WHERE user_id = $1 AND club_id = $2`,
      [userId, clubId]
    );
    const trainings = await pool.query(
      `SELECT COUNT(*) FROM trainings WHERE club_id = $1 AND team_id = ANY($2::int[])`,
      [clubId, teamIds]
    );
    const upcomingTrainings = await pool.query(
      `SELECT COUNT(*) FROM trainings
       WHERE club_id = $1 AND team_id = ANY($2::int[]) AND date >= CURRENT_DATE`,
      [clubId, teamIds]
    );
    const matchesTotal = await pool.query(
      `SELECT COUNT(*) FROM matches WHERE club_id = $1 AND team_id = ANY($2::int[])`,
      [clubId, teamIds]
    );
    const attendance = await pool.query(
      `SELECT ROUND(AVG(CASE WHEN ta.status='present' THEN 1 ELSE 0 END)*100,1) AS rate
       FROM training_attendance ta
       JOIN trainings t ON t.id = ta.training_id
       WHERE t.club_id = $1 AND t.team_id = ANY($2::int[])`,
      [clubId, teamIds]
    );
    const winLoss = await pool.query(
      `SELECT
         SUM(CASE WHEN our_score > opponent_score THEN 1 ELSE 0 END) AS wins,
         SUM(CASE WHEN our_score < opponent_score THEN 1 ELSE 0 END) AS losses
       FROM matches
       WHERE club_id = $1 AND team_id = ANY($2::int[])
         AND our_score IS NOT NULL AND opponent_score IS NOT NULL`,
      [clubId, teamIds]
    );

    return res.json({
      athletes: Number(children.rows[0].count),
      coaches: 0,
      teams: teamIds.length,
      trainings: Number(trainings.rows[0].count),
      upcoming_trainings: Number(upcomingTrainings.rows[0].count),
      matches: Number(matchesTotal.rows[0].count),
      attendance_rate: attendance.rows[0].rate ?? 0,
      wins: Number(winLoss.rows[0].wins ?? 0),
      losses: Number(winLoss.rows[0].losses ?? 0),
      linked_children: Number(children.rows[0].count),
    });
  }

  const athletes = await pool.query(
    `SELECT COUNT(*) FROM club_users WHERE club_id=$1 AND role='athlete'`,
    [clubId]
  );

  const coaches = await pool.query(
    `SELECT COUNT(*) FROM club_users WHERE club_id=$1 AND role='coach'`,
    [clubId]
  );

  const teams = await pool.query(
    `SELECT COUNT(*) FROM teams WHERE club_id=$1`,
    [clubId]
  );

  const attendance = await pool.query(
    `SELECT ROUND(AVG(CASE WHEN status='present' THEN 1 ELSE 0 END)*100,1) AS rate
     FROM training_attendance ta
     JOIN trainings t ON t.id = ta.training_id
     WHERE t.club_id=$1`,
    [clubId]
  );

  const winLoss = await pool.query(
    `SELECT
       SUM(CASE WHEN our_score > opponent_score THEN 1 ELSE 0 END) AS wins,
       SUM(CASE WHEN our_score < opponent_score THEN 1 ELSE 0 END) AS losses
     FROM matches
     WHERE club_id=$1 AND our_score IS NOT NULL AND opponent_score IS NOT NULL`,
    [clubId]
  );

  const trainings = await pool.query(
    `SELECT COUNT(*) FROM trainings WHERE club_id=$1`,
    [clubId]
  );

  const upcomingTrainings = await pool.query(
    `SELECT COUNT(*) FROM trainings WHERE club_id=$1 AND date >= CURRENT_DATE`,
    [clubId]
  );

  const matchesTotal = await pool.query(
    `SELECT COUNT(*) FROM matches WHERE club_id=$1`,
    [clubId]
  );

  res.json({
    athletes: Number(athletes.rows[0].count),
    coaches: Number(coaches.rows[0].count),
    teams: Number(teams.rows[0].count),
    trainings: Number(trainings.rows[0].count),
    upcoming_trainings: Number(upcomingTrainings.rows[0].count),
    matches: Number(matchesTotal.rows[0].count),
    attendance_rate: attendance.rows[0].rate ?? 0,
    wins: Number(winLoss.rows[0].wins ?? 0),
    losses: Number(winLoss.rows[0].losses ?? 0)
  });
};

//
// TEAM ANALYTICS
//
export const getTeamAnalytics = async (req, res) => {
  const { teamId } = req.params;

  const team = await pool.query(
    `SELECT id, name, category FROM teams WHERE id = $1`,
    [teamId]
  );

  const roster = await pool.query(
    `SELECT COUNT(*) FROM team_athletes WHERE team_id = $1`,
    [teamId]
  );

  const trainingCount = await pool.query(
    `SELECT COUNT(*) FROM trainings WHERE team_id = $1`,
    [teamId]
  );

  const attendance = await pool.query(
    `SELECT ROUND(AVG(CASE WHEN status='present' THEN 1 ELSE 0 END)*100,1) AS rate
     FROM training_attendance ta
     JOIN trainings t ON t.id = ta.training_id
     WHERE t.team_id=$1`,
    [teamId]
  );

  const winLoss = await pool.query(
    `SELECT
       SUM(CASE WHEN our_score > opponent_score THEN 1 ELSE 0 END) AS wins,
       SUM(CASE WHEN our_score < opponent_score THEN 1 ELSE 0 END) AS losses
     FROM matches
     WHERE team_id=$1 AND our_score IS NOT NULL AND opponent_score IS NOT NULL`,
    [teamId]
  );

  const stats = await pool.query(
    `SELECT
       AVG(points) AS avg_points,
       AVG(rebounds) AS avg_rebounds,
       AVG(assists) AS avg_assists
     FROM match_stats ms
     JOIN matches m ON m.id = ms.match_id
     WHERE m.team_id=$1`,
    [teamId]
  );

  const topScorers = await pool.query(
    `SELECT u.id AS athlete_id, u.full_name, AVG(ms.points) AS ppg
     FROM match_stats ms
     JOIN users u ON u.id = ms.athlete_id
     JOIN matches m ON m.id = ms.match_id
     WHERE m.team_id=$1
     GROUP BY u.id, u.full_name
     ORDER BY ppg DESC
     LIMIT 5`,
    [teamId]
  );

  res.json({
    team: team.rows[0],
    roster_size: Number(roster.rows[0].count),
    trainings: Number(trainingCount.rows[0].count),
    attendance_rate: attendance.rows[0].rate ?? 0,
    wins: Number(winLoss.rows[0].wins ?? 0),
    losses: Number(winLoss.rows[0].losses ?? 0),
    averages: stats.rows[0],
    top_scorers: topScorers.rows
  });
};

//
// ATHLETE ANALYTICS
//
export const getAthleteAnalytics = async (req, res) => {
  const { athleteId } = req.params;

  const stats = await pool.query(
    `SELECT
       AVG(points) AS ppg,
       AVG(rebounds) AS rpg,
       AVG(assists) AS apg,
       COUNT(*) AS games_played
     FROM match_stats
     WHERE athlete_id=$1`,
    [athleteId]
  );

  const attendance = await pool.query(
    `SELECT ROUND(AVG(CASE WHEN status='present' THEN 1 ELSE 0 END)*100,1) AS rate
     FROM training_attendance
     WHERE athlete_id=$1`,
    [athleteId]
  );

  const trend = await pool.query(
    `SELECT m.date, ms.points, ms.rebounds, ms.assists
     FROM match_stats ms
     JOIN matches m ON m.id = ms.match_id
     WHERE ms.athlete_id=$1
     ORDER BY m.date ASC`,
    [athleteId]
  );

  res.json({
    summary: stats.rows[0],
    attendance_rate: attendance.rows[0].rate,
    trend: trend.rows
  });
};

//
// TRAINING ANALYTICS
//
export const getTrainingAnalytics = async (req, res) => {
  const { teamId } = req.params;

  const trend = await pool.query(
    `SELECT
       DATE_TRUNC('month', t.date) AS month,
       ROUND(AVG(CASE WHEN ta.status='present' THEN 1 ELSE 0 END)*100,1) AS attendance_rate
     FROM training_attendance ta
     JOIN trainings t ON t.id = ta.training_id
     WHERE t.team_id=$1
     GROUP BY month
     ORDER BY month`,
    [teamId]
  );

  res.json(trend.rows);
};

//
// MATCH ANALYTICS
//
export const getMatchAnalytics = async (req, res) => {
  const { teamId } = req.params;

  const trend = await pool.query(
    `SELECT date, our_score
     FROM matches
     WHERE team_id=$1
     ORDER BY date ASC`,
    [teamId]
  );

  res.json(trend.rows);
};

export const getClubCalendar = async (req, res) => {
  const { clubId } = req.params;
  const { from, to } = req.query;
  const role = req.user.role;
  const userId = req.user.user_id;

  const fromDate = from || new Date().toISOString().slice(0, 10);
  const toDate = to || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

  let teamParams = [clubId, fromDate, toDate];
  let trainingFilter = "";
  let matchFilter = "";

  if (role === "parent") {
    const teamIds = await getParentTeamIds(userId, clubId);
    if (!teamIds.length) return res.json([]);
    trainingFilter = " AND t.team_id = ANY($4::int[])";
    matchFilter = " AND m.team_id = ANY($4::int[])";
    teamParams.push(teamIds);
  }

  const trainings = await pool.query(
    `SELECT t.id, t.date, t.start_time, t.end_time, t.location,
            t.team_id, tm.name AS team_name, 'training' AS event_type, NULL AS opponent
     FROM trainings t
     JOIN teams tm ON tm.id = t.team_id
     WHERE t.club_id = $1 AND t.date BETWEEN $2 AND $3${trainingFilter}
     ORDER BY t.date, t.start_time`,
    teamParams
  );

  const matches = await pool.query(
    `SELECT m.id, m.date, m.start_time, NULL AS end_time, m.location,
            m.team_id, tm.name AS team_name, 'match' AS event_type, m.opponent
     FROM matches m
     JOIN teams tm ON tm.id = m.team_id
     WHERE m.club_id = $1 AND m.date BETWEEN $2 AND $3${matchFilter}
     ORDER BY m.date, m.start_time`,
    teamParams
  );

  res.json([...trainings.rows, ...matches.rows]);
};

export const getUpcomingEvents = async (req, res) => {
  const { clubId } = req.params;
  const limit = Math.min(Number(req.query.limit) || 5, 20);
  const role = req.user.role;
  const userId = req.user.user_id;

  let teamIds = null;
  if (role === "parent") {
    teamIds = await getParentTeamIds(userId, clubId);
    if (!teamIds.length) return res.json([]);
  }

  const trainingFilter = teamIds ? " AND t.team_id = ANY($3::int[])" : "";
  const trainingParams = teamIds ? [clubId, limit, teamIds] : [clubId, limit];
  const trainings = await pool.query(
    `SELECT t.id, t.date, t.start_time, t.location, tm.name AS team_name,
            t.team_id, 'training' AS event_type, NULL AS opponent
     FROM trainings t
     JOIN teams tm ON tm.id = t.team_id
     WHERE t.club_id = $1 AND t.date >= CURRENT_DATE${trainingFilter}
     ORDER BY t.date, t.start_time
     LIMIT $2`,
    trainingParams
  );

  const matchFilter = teamIds ? " AND m.team_id = ANY($3::int[])" : "";
  const matchParams = teamIds ? [clubId, limit, teamIds] : [clubId, limit];
  const matches = await pool.query(
    `SELECT m.id, m.date, m.start_time, m.location, tm.name AS team_name,
            m.team_id, 'match' AS event_type, m.opponent
     FROM matches m
     JOIN teams tm ON tm.id = m.team_id
     WHERE m.club_id = $1 AND m.date >= CURRENT_DATE${matchFilter}
     ORDER BY m.date, m.start_time
     LIMIT $2`,
    matchParams
  );

  const combined = [...trainings.rows, ...matches.rows]
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(0, limit);

  res.json(combined);
};
