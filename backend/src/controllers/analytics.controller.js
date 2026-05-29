import { pool } from "../db/pool.js";

//
// CLUB ANALYTICS
//
export const getClubAnalytics = async (req, res) => {
  const { clubId } = req.params;

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
