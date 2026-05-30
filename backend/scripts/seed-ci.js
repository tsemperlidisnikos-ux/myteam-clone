/**
 * CI seed — idempotent test user for Playwright / GitHub Actions.
 * Usage: npm run seed:ci
 */
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { pool } from "../src/db/pool.js";

dotenv.config();

const CI_EMAIL = process.env.CI_USER_EMAIL || "ci@myteam.local";
const CI_PASSWORD = process.env.CI_USER_PASSWORD || "ci123456";
const CI_CLUB = process.env.CI_CLUB_NAME || "CI Test Club";

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let userId;
    const existing = await client.query(`SELECT id FROM users WHERE email = $1`, [CI_EMAIL]);
    if (existing.rows[0]) {
      userId = existing.rows[0].id;
    } else {
      const hash = await bcrypt.hash(CI_PASSWORD, 10);
      const u = await client.query(
        `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
        ["CI Admin", CI_EMAIL, hash]
      );
      userId = u.rows[0].id;
      console.log("Created CI user:", CI_EMAIL);
    }

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
      [clubId, userId]
    );

    await client.query("COMMIT");
    console.log("CI seed OK — login:", CI_EMAIL, "/", CI_PASSWORD);
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
