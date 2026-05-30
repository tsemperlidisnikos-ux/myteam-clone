import { pool } from "../db/pool.js";

let ExpoClass;

async function loadExpo() {
  if (ExpoClass !== undefined) return ExpoClass;
  try {
    const mod = await import("expo-server-sdk");
    ExpoClass = mod.Expo;
  } catch {
    ExpoClass = null;
  }
  return ExpoClass;
}

export async function sendPushToUsers(userIds, { title, body }) {
  if (!userIds?.length || !title) return;

  const Expo = await loadExpo();
  const uniqueIds = [...new Set(userIds)];

  const { rows } = await pool.query(
    `SELECT token FROM push_tokens WHERE user_id = ANY($1::int[])`,
    [uniqueIds]
  );
  if (!rows.length) return;

  if (!Expo) {
    console.log("[push]", title, "→", rows.length, "token(s)");
    return;
  }

  const expo = new Expo();
  const messages = [];
  for (const { token } of rows) {
    if (!Expo.isExpoPushToken(token)) continue;
    messages.push({ to: token, sound: "default", title, body: body || "" });
  }
  if (!messages.length) return;

  for (const chunk of expo.chunkPushNotifications(messages)) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error("[push] send failed:", err.message);
    }
  }
}

export async function sendPushToUser(userId, payload) {
  return sendPushToUsers([userId], payload);
}
