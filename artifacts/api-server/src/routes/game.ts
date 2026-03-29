import { Router, type IRouter } from "express";
import {
  GetGameStateResponse,
  GetGameHistoryResponse,
  PlaceBetBody,
  PlaceBetResponse,
  CashOutBody,
  CashOutResponse,
  GetActivePlayersResponse,
  GetLeaderboardResponse,
  GetWalletResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import * as engine from "../lib/gameEngine";

const router: IRouter = Router();

router.get("/game/state", (_req, res) => {
  const state = engine.getState();
  const data = GetGameStateResponse.parse({
    phase: state.phase,
    multiplier: state.multiplier,
    crashedAt: state.crashedAt ?? null,
    roundId: state.roundId,
    countdownMs: state.countdownMs ?? null,
    onlineCount: state.onlineCount,
    playingCount: state.playingCount,
  });
  res.json(data);
});

router.get("/game/history", async (_req, res) => {
  const limit = parseInt(String(_req.query.limit ?? "20"), 10);
  const rounds = await engine.getHistory(limit);
  const data = GetGameHistoryResponse.parse(
    rounds.map(r => ({
      id: r.id,
      crashedAt: r.crashedAt ?? 1.0,
      hash: r.hash,
      createdAt: r.createdAt.toISOString(),
    }))
  );
  res.json(data);
});

router.post("/game/bet", async (req, res) => {
  const body = PlaceBetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const result = await engine.placeBet(
      body.data.playerId,
      body.data.amount,
      body.data.autoCashOut ?? null
    );
    const data = PlaceBetResponse.parse({ success: true, betId: result.betId, balance: result.balance });
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/game/cashout", async (req, res) => {
  const body = CashOutBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  try {
    const result = await engine.cashOut(body.data.betId, body.data.playerId);
    const data = CashOutResponse.parse({ success: true, ...result });
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/players", (_req, res) => {
  const players = engine.getActivePlayers();
  const data = GetActivePlayersResponse.parse(
    players.map(p => ({
      id: p.id,
      username: p.username,
      amount: p.amount,
      multiplier: p.multiplier ?? null,
      profit: p.profit ?? null,
      cashedOut: p.cashedOut,
      hash: p.hash,
    }))
  );
  res.json(data);
});

router.get("/players/leaderboard", (_req, res) => {
  const data = GetLeaderboardResponse.parse(engine.getLeaderboard());
  res.json(data);
});

router.get("/wallet", async (req, res) => {
  const playerId = String(req.query.playerId ?? "");

  if (!playerId) {
    res.status(400).json({ error: "playerId is required" });
    return;
  }

  let player = await db.query.playersTable.findFirst({
    where: eq(playersTable.id, playerId)
  });

  if (!player) {
    const username = "Serria" + Math.floor(Math.random() * 9999);
    [player] = await db.insert(playersTable).values({
      id: playerId,
      username,
      balance: 2330,
    }).returning();
  }

  const data = GetWalletResponse.parse({ balance: player.balance, playerId: player.id });
  res.json(data);
});

export default router;
