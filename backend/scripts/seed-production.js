/**
 * Production seed — creates club + admin on empty DB.
 * Usage: DATABASE_URL=... npm run seed:production
 */
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { pool } from "../src/db/pool.js";

dotenv.config();

const ADMIN_EMAIL = process.env.PROD_ADMIN_EMAIL || "nikos.tseberlidis@gmail.com";
const ADMIN_PASSWORD = process.env.PROD_ADMIN_PASSWORD || "123456";
const ADMIN_NAME = process.env.PROD_ADMIN_NAME || "NIKOS TSEBERLIDIS";
const CLUB_NAME = process.env.PROD_CLUB_NAME || "PROMITHEAS BC";
const CLUB_CITY = process.env.PROD_CLUB_CITY || "Athens";

async function main() {
  const existing = await pool.query(`SELECT id FROM clubs WHERE name = $1 LIMIT 1`, [CLUB_NAME]);
  if (existing.rows[0]) {
    console.log(`Club "${CLUB_NAME}" already exists — skip seed.`);
    await pool.end();
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const user = await client.query(
      `INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
      [ADMIN_NAME, ADMIN_EMAIL.toLowerCase(), hash]
    );
    const adminId = user.rows[0].id;

    const club = await client.query(
      `INSERT INTO clubs (name, country, city) VALUES ($1, 'GR', $2) RETURNING id`,
      [CLUB_NAME, CLUB_CITY]
    );
    const clubId = club.rows[0].id;

    await client.query(
      `INSERT INTO club_users (club_id, user_id, role) VALUES ($1, $2, 'admin')`,
      [clubId, adminId]
    );

    const team = await client.query(
      `INSERT INTO teams (club_id, name, category) VALUES ($1, 'U16 Boys', 'U16') RETURNING id`,
      [clubId]
    );
    await client.query(
      `INSERT INTO team_coaches (team_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [team.rows[0].id, adminId]
    );

    await client.query("COMMIT");
    console.log("Production seed OK");
    console.log(`  Club: ${CLUB_NAME}`);
    console.log(`  Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Production seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
