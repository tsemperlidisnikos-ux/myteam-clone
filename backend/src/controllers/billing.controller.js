import Stripe from "stripe";
import { pool } from "../db/pool.js";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export const getBillingStatus = async (req, res) => {
  const { clubId } = req.params;
  const club = await pool.query(
    `SELECT subscription_status, plan_tier, stripe_customer_id FROM clubs WHERE id = $1`,
    [clubId]
  );
  const row = club.rows[0] || {};
  res.json({
    club_id: Number(clubId),
    subscription_status: row.subscription_status || "trial",
    plan_tier: row.plan_tier || "free",
    stripe_configured: Boolean(process.env.STRIPE_SECRET_KEY),
    stripe_customer_id: row.stripe_customer_id || null,
  });
};

export const createCheckoutSession = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(501).json({ error: "Stripe not configured", hint: "Set STRIPE_SECRET_KEY" });
  }

  const { clubId } = req.params;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return res.status(501).json({ error: "Set STRIPE_PRICE_ID in .env" });
  }

  const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${frontend}/settings?billing=success`,
    cancel_url: `${frontend}/settings?billing=cancel`,
    metadata: { club_id: String(clubId) },
  });

  res.json({ url: session.url, session_id: session.id });
};

export const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return res.status(501).json({ error: "Webhook not configured" });
  }

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const clubId = session.metadata?.club_id;
    if (clubId) {
      await pool.query(
        `UPDATE clubs SET subscription_status = 'active', plan_tier = 'pro' WHERE id = $1`,
        [clubId]
      );
    }
  }

  res.json({ received: true });
};
