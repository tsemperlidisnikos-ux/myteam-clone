import Stripe from "stripe";
import { pool } from "../db/pool.js";
import { sendEmail } from "../services/email.service.js";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

async function canAccessPayment(req, clubId, payment) {
  const role = req.user.role;
  const userId = req.user.user_id;
  if (role === "admin" || role === "coach") return true;
  if (role === "athlete" && payment.athlete_user_id === userId) return true;
  if (role === "parent") {
    const link = await pool.query(
      `SELECT 1 FROM parent_athletes pa
       JOIN athlete_profiles ap ON ap.id = pa.athlete_id
       WHERE pa.user_id = $1 AND pa.club_id = $2 AND ap.user_id = $3`,
      [userId, clubId, payment.athlete_user_id]
    );
    return link.rows.length > 0;
  }
  return false;
}

export const listAthletePayments = async (req, res) => {
  const { clubId } = req.params;
  const role = req.user.role;
  const userId = req.user.user_id;

  let query = `SELECT p.*, u.full_name AS athlete_name, u.email AS athlete_email
     FROM athlete_payments p
     JOIN users u ON u.id = p.athlete_user_id
     WHERE p.club_id = $1`;
  const params = [clubId];

  if (role === "athlete") {
    query += ` AND p.athlete_user_id = $2`;
    params.push(userId);
  } else if (role === "parent") {
    query += ` AND p.athlete_user_id IN (
      SELECT ap.user_id FROM parent_athletes pa
      JOIN athlete_profiles ap ON ap.id = pa.athlete_id
      WHERE pa.user_id = $2 AND pa.club_id = $1
    )`;
    params.push(userId);
  }

  query += ` ORDER BY p.created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
};

export const createAthletePayment = async (req, res) => {
  const { clubId } = req.params;
  const { athlete_user_id, amount_cents, period_label, currency = "EUR" } = req.body;
  if (!athlete_user_id || !amount_cents) {
    return res.status(400).json({ error: "athlete_user_id and amount_cents required" });
  }

  const result = await pool.query(
    `INSERT INTO athlete_payments (club_id, athlete_user_id, amount_cents, currency, period_label)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [clubId, athlete_user_id, amount_cents, currency, period_label || null]
  );
  res.json(result.rows[0]);
};

export const checkoutAthletePayment = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(501).json({ error: "Stripe not configured" });

  const { clubId, paymentId } = req.params;
  const row = await pool.query(
    `SELECT p.*, u.email, u.full_name
     FROM athlete_payments p
     JOIN users u ON u.id = p.athlete_user_id
     WHERE p.id = $1 AND p.club_id = $2`,
    [paymentId, clubId]
  );
  const payment = row.rows[0];
  if (!payment) return res.status(404).json({ error: "Payment not found" });
  if (payment.status === "paid") return res.status(400).json({ error: "Already paid" });
  if (!(await canAccessPayment(req, clubId, payment))) {
    return res.status(403).json({ error: "Access denied" });
  }

  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: payment.email,
    line_items: [
      {
        price_data: {
          currency: payment.currency || "eur",
          unit_amount: payment.amount_cents,
          product_data: {
            name: payment.period_label || "MyTeam membership fee",
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${frontend}/fees?paid=1`,
    cancel_url: `${frontend}/fees?paid=0`,
    metadata: {
      type: "athlete_payment",
      payment_id: String(payment.id),
      club_id: String(clubId),
    },
  });

  await pool.query(
    `UPDATE athlete_payments SET stripe_session_id = $1 WHERE id = $2`,
    [session.id, payment.id]
  );

  res.json({ url: session.url });
};

export async function markAthletePaymentPaid(session) {
  const paymentId = session.metadata?.payment_id;
  if (!paymentId) return;

  const updated = await pool.query(
    `UPDATE athlete_payments SET status = 'paid', paid_at = NOW()
     WHERE id = $1
     RETURNING *, (SELECT email FROM users WHERE id = athlete_user_id) AS email,
               (SELECT full_name FROM users WHERE id = athlete_user_id) AS athlete_name`,
    [paymentId]
  );
  const p = updated.rows[0];
  if (p?.email) {
    const amount = (p.amount_cents / 100).toFixed(2);
    await sendEmail({
      to: p.email,
      subject: "MyTeam — επιβεβαίωση πληρωμής",
      text: `Η πληρωμή ${amount} ${p.currency} (${p.period_label || ""}) καταχωρήθηκε.`,
      html: `<p>Η πληρωμή <strong>${amount} ${p.currency}</strong> καταχωρήθηκε επιτυχώς.</p>`,
    });
  }
}
