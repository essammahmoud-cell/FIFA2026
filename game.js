// api/game.js - Vercel serverless function
// Uses Firebase Realtime Database REST API (no SDK needed)

const FB_URL = "https://fifa2026-e8ef2-default-rtdb.firebaseio.com";

async function getGame() {
  const res = await fetch(`${FB_URL}/game.json`);
  if (!res.ok) throw new Error("Firebase read failed");
  const data = await res.json();
  return data || { players: [], predictions: {}, results: {} };
}

async function setGame(data) {
  const res = await fetch(`${FB_URL}/game.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Firebase write failed");
  return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const game = await getGame();
      return res.json(game);
    }

    const { action } = req.query;
    const body = req.body;
    const game = await getGame();

    if (action === "join") {
      const { name } = body;
      if (!name) return res.status(400).json({ error: "name required" });
      if (!game.players.includes(name)) game.players.push(name);
      await setGame(game);
      return res.json({ players: game.players });
    }

    if (action === "predict") {
      const { name, matchId, h, a } = body;
      if (!name || !matchId) return res.status(400).json({ error: "missing fields" });
      if (!game.predictions[matchId]) game.predictions[matchId] = {};
      game.predictions[matchId][name] = { h, a };
      await setGame(game);
      return res.json({ ok: true });
    }

    if (action === "result") {
      const { matchId, h, a } = body;
      if (!matchId) return res.status(400).json({ error: "missing matchId" });
      game.results[matchId] = { h, a };
      await setGame(game);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: "unknown action" });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
