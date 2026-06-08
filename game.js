// api/game.js - Vercel serverless function
// Stores game state in Vercel KV (free tier)

import { kv } from "@vercel/kv";

const GAME_KEY = "fifa2026_game";

async function getGame() {
  const data = await kv.get(GAME_KEY);
  return data || { players: [], predictions: {}, results: {} };
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
      await kv.set(GAME_KEY, game);
      return res.json({ players: game.players });
    }

    if (action === "predict") {
      const { name, matchId, h, a } = body;
      if (!name || !matchId) return res.status(400).json({ error: "missing fields" });
      if (!game.predictions[matchId]) game.predictions[matchId] = {};
      game.predictions[matchId][name] = { h, a };
      await kv.set(GAME_KEY, game);
      return res.json({ ok: true });
    }

    if (action === "result") {
      const { matchId, h, a } = body;
      if (!matchId) return res.status(400).json({ error: "missing matchId" });
      game.results[matchId] = { h, a };
      await kv.set(GAME_KEY, game);
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: "unknown action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
