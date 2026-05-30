/**
 * Stripe billing scaffold — wire STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in production.
 */
export const getBillingStatus = async (req, res) => {
  const { clubId } = req.params;
  res.json({
    club_id: Number(clubId),
    subscription_status: "trial",
    plan_tier: "free",
    stripe_configured: Boolean(process.env.STRIPE_SECRET_KEY),
    message: "Stripe Checkout not wired yet. Set STRIPE_SECRET_KEY to enable.",
  });
};

export const createCheckoutSession = async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(501).json({
      error: "Stripe not configured",
      hint: "Add STRIPE_SECRET_KEY to backend/.env",
    });
  }
  res.status(501).json({ error: "Implement Stripe Checkout session creation here" });
};

export const stripeWebhook = async (req, res) => {
  res.status(501).json({ error: "Implement Stripe webhook handler here" });
};
