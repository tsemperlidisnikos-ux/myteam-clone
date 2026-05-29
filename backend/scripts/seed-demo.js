/**
 * Demo seed for MyTeam — idempotent, safe to re-run.
 * Usage: npm run seed
 * Optional: DEMO_CLUB_ID=1 in .env
 */
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { pool } from "../src/db/pool.js";

dotenv.config();

const DEMO_ATHLETES = [
  { full_name: "Giorgos Papadopoulos", email: "demo.giorgos@myteam.local", position: "PG" },
  { full_name: "Nikos Antoniou", email: "demo.nikos@myteam.local", position: "SG" },
  { full_name: "Michalis Konstantinou", email: "demo.michalis@myteam.local", position: "SF" },
  { full_name: "Andreas Demetriou", email: "demo.andreas@myteam.local", position: "PF" },
];

async function getClubId(client) {
  if (process.env.DEMO_CLUB_ID) {
    return Number(process.env.DEMO_CLUB_ID);
  }
  const r = await client.query("SELECT id FROM clubs ORDER BY id LIMIT 1");
  if (!r.rows[0]) throw new Error("No club found. Register a club first.");
  return r.rows[0].id;
}

async function getAdminUserId(client, clubId) {
  const r = await client.query(
    `SELECT user_id FROM club_users WHERE club_id = $1 AND role = 'admin' LIMIT 1`,
    [clubId]
  );
  if (!r.rows[0]) throw new Error("No admin user for club");
  return r.rows[0].user_id;
}

async function ensureTeam(client, clubId, name, category) {
  let r = await client.query(
    `SELECT id FROM teams WHERE club_id = $1 AND name = $2`,
    [clubId, name]
  );
  if (r.rows[0]) return r.rows[0].id;

  r = await client.query(
    `INSERT INTO teams (club_id, name, category) VALUES ($1, $2, $3) RETURNING id`,
    [clubId, name, category]
  );
  console.log(`  + Team: ${name}`);
  return r.rows[0].id;
}

async function ensureAthlete(client, clubId, { full_name, email, position }) {
  let r = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
  let userId;

  if (r.rows[0]) {
    userId = r.rows[0].id;
  } else {
    const hash = await bcrypt.hash("temp1234", 10);
    r = await client.query(
      `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
      [full_name, email, hash]
    );
    userId = r.rows[0].id;
    console.log(`  + Athlete: ${full_name}`);
  }

  await client.query(
    `INSERT INTO club_users (club_id, user_id, role) VALUES ($1, $2, 'athlete')
     ON CONFLICT (club_id, user_id) DO NOTHING`,
    [clubId, userId]
  );

  await client.query(
    `INSERT INTO athlete_profiles (user_id, position) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET position = EXCLUDED.position`,
    [userId, position]
  );

  return userId;
}

async function assignCoach(client, teamId, userId) {
  await client.query(
    `INSERT INTO team_coaches (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [teamId, userId]
  );
}

async function assignAthlete(client, teamId, userId) {
  await client.query(
    `INSERT INTO team_athletes (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [teamId, userId]
  );
}

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const clubId = await getClubId(client);
    const adminId = await getAdminUserId(client, clubId);
    console.log(`Seeding demo data for club #${clubId}...`);

    const u16Id = await ensureTeam(client, clubId, "U16 Boys", "U16");
    const u18Id = await ensureTeam(client, clubId, "U18 Boys", "U18");

    await assignCoach(client, u16Id, adminId);
    await assignCoach(client, u18Id, adminId);

    const athleteIds = [];
    for (const a of DEMO_ATHLETES) {
      const id = await ensureAthlete(client, clubId, a);
      athleteIds.push(id);
      await assignAthlete(client, u16Id, id);
    }

    // First 2 athletes also on U18
    if (athleteIds[0]) await assignAthlete(client, u18Id, athleteIds[0]);
    if (athleteIds[1]) await assignAthlete(client, u18Id, athleteIds[1]);

    const trainingCheck = await client.query(
      `SELECT id FROM trainings WHERE club_id = $1 AND team_id = $2 LIMIT 1`,
      [clubId, u16Id]
    );

    let trainingId = trainingCheck.rows[0]?.id;
    if (!trainingId) {
      const t = await client.query(
        `INSERT INTO trainings (club_id, team_id, coach_id, date, start_time, end_time, location, notes)
         VALUES ($1, $2, $3, CURRENT_DATE - 7, '18:00', '20:00', 'Main Court', 'Demo practice session')
         RETURNING id`,
        [clubId, u16Id, adminId]
      );
      trainingId = t.rows[0].id;
      console.log("  + Training session");

      const t2 = await client.query(
        `INSERT INTO trainings (club_id, team_id, coach_id, date, start_time, end_time, location, notes)
         VALUES ($1, $2, $3, CURRENT_DATE + 3, '18:00', '20:00', 'Main Court', 'Upcoming practice')
         RETURNING id`,
        [clubId, u16Id, adminId]
      );

      for (let i = 0; i < athleteIds.length; i++) {
        const status = i === 2 ? "late" : "present";
        await client.query(
          `INSERT INTO training_attendance (training_id, athlete_id, status)
           VALUES ($1, $2, $3) ON CONFLICT (training_id, athlete_id) DO NOTHING`,
          [trainingId, athleteIds[i], status]
        );
      }
      console.log("  + Attendance records");
      void t2;
    }

    const matchCheck = await client.query(
      `SELECT id FROM matches WHERE club_id = $1 AND team_id = $2 LIMIT 1`,
      [clubId, u16Id]
    );

    if (!matchCheck.rows[0]) {
      const m = await client.query(
        `INSERT INTO matches (club_id, team_id, opponent, date, location, competition, our_score, opponent_score)
         VALUES ($1, $2, 'AEK Athens', CURRENT_DATE - 14, 'Away', 'League', 72, 65)
         RETURNING id`,
        [clubId, u16Id]
      );
      const matchId = m.rows[0].id;
      console.log("  + Match vs AEK Athens (72-65 W)");

      const stats = [
        [18, 4, 6],
        [15, 3, 4],
        [12, 6, 2],
        [10, 8, 1],
      ];
      for (let i = 0; i < athleteIds.length; i++) {
        const [points, rebounds, assists] = stats[i];
        await client.query(
          `INSERT INTO match_stats (match_id, athlete_id, points, rebounds, assists)
           VALUES ($1, $2, $3, $4, $5) ON CONFLICT (match_id, athlete_id) DO NOTHING`,
          [matchId, athleteIds[i], points, rebounds, assists]
        );
      }
      console.log("  + Match stats");
    }

    await client.query("COMMIT");
    console.log("\nDemo seed complete.");
    console.log("Try: Teams → U16 Boys → Roster | Trainings → Attendance | Analytics");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
