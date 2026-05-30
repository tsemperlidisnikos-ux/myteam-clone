/**
 * CI seed — idempotent test user, team, and coach for Playwright / GitHub Actions.
 * Usage: npm run seed:ci
 */
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { pool } from "../src/db/pool.js";

dotenv.config();

const CI_EMAIL = process.env.CI_USER_EMAIL || "ci@myteam.local";
const CI_PASSWORD = process.env.CI_USER_PASSWORD || "ci123456";
const CI_COACH_EMAIL = process.env.CI_COACH_EMAIL || "ci-coach@myteam.local";
const CI_COACH_PASSWORD = process.env.CI_COACH_PASSWORD || "ci123456";
const CI_CLUB = process.env.CI_CLUB_NAME || "CI Test Club";
const CI_TEAM = process.env.CI_TEAM_NAME || "CI Team U16";

async function ensureUser(client, { full_name, email, password }) {
  let userId;
  const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing.rows[0]) {
    userId = existing.rows[0].id;
  } else {
    const hash = await bcrypt.hash(password, 10);
    const u = await client.query(
      `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
      [full_name, email, hash]
    );
    userId = u.rows[0].id;
    console.log("Created user:", email);
  }
  return userId;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const adminId = await ensureUser(client, {
      full_name: "CI Admin",
      email: CI_EMAIL,
      password: CI_PASSWORD,
    });

    const coachId = await ensureUser(client, {
      full_name: "CI Coach",
      email: CI_COACH_EMAIL,
      password: CI_COACH_PASSWORD,
    });

    let clubId;
    const clubRow = await client.query(`SELECT id FROM clubs WHERE name = $1 LIMIT 1`, [CI_CLUB]);
    if (clubRow.rows[0]) {
      clubId = clubRow.rows[0].id;
    } else {
      const c = await client.query(
        `INSERT INTO clubs (name, country, city) VALUES ($1, 'GR', 'Athens') RETURNING id`,
        [CI_CLUB]
      );
      clubId = c.rows[0].id;
      console.log("Created CI club:", CI_CLUB);
    }

    await client.query(
      `INSERT INTO club_users (club_id, user_id, role) VALUES ($1, $2, 'admin')
       ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'admin'`,
      [clubId, adminId]
    );

    await client.query(
      `INSERT INTO club_users (club_id, user_id, role) VALUES ($1, $2, 'coach')
       ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'coach'`,
      [clubId, coachId]
    );

    let teamId;
    const teamRow = await client.query(
      `SELECT id FROM teams WHERE club_id = $1 AND name = $2 LIMIT 1`,
      [clubId, CI_TEAM]
    );
    if (teamRow.rows[0]) {
      teamId = teamRow.rows[0].id;
    } else {
      const t = await client.query(
        `INSERT INTO teams (club_id, name, category) VALUES ($1, $2, 'U16') RETURNING id`,
        [clubId, CI_TEAM]
      );
      teamId = t.rows[0].id;
      console.log("Created CI team:", CI_TEAM);
    }

    await client.query(
      `INSERT INTO team_coaches (team_id, user_id) VALUES ($1, $2)
       ON CONFLICT (team_id, user_id) DO NOTHING`,
      [teamId, coachId]
    );

    await client.query("COMMIT");
    console.log("CI seed OK");
    console.log("  Admin:", CI_EMAIL, "/", CI_PASSWORD);
    console.log("  Coach:", CI_COACH_EMAIL, "/", CI_COACH_PASSWORD);
    console.log("  Team:", CI_TEAM);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("CI seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
