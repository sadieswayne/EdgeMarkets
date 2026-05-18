import { Router, type Request, type Response } from "express";
import {
  engine,
  bots,
  BOT_TEMPLATES,
  aiStatus,
  aiUsage,
  newsAlerts,
} from "./store";

const chatSessions = new Map<
  string,
  { opportunityId: string | null; createdAt: number }
>();

function uuid() {
  return "xxxxxxxxxxxx4xxxyxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const CANNED_REPLY = (opportunityId: string | null) =>
  `Here's my read on ${
    opportunityId ? "this opportunity" : "the current board"
  }:\n\n` +
  `• The spread looks driven by a short-lived liquidity/latency imbalance rather than a structural mispricing, so treat the window as minutes, not hours.\n` +
  `• Net of taker fees and estimated slippage the edge is still positive, but size conservatively — the quoted depth rarely supports the full notional.\n` +
  `• Use limit orders on both legs and execute them as close to simultaneously as possible to avoid leg risk.\n\n` +
  `Set an alert if the spread compresses below your fee threshold and be ready to unwind the filled leg if the second one misses.`;

function streamText(res: Response, text: string) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  const words = text.split(/(\s+)/);
  let i = 0;
  const timer = setInterval(() => {
    if (i >= words.length) {
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      clearInterval(timer);
      res.end();
      return;
    }
    res.write(
      `data: ${JSON.stringify({ type: "delta", text: words[i] })}\n\n`,
    );
    i += 1;
  }, 18);
  res.on("close", () => clearInterval(timer));
}

async function streamAnthropic(
  res: Response,
  prompt: string,
  opportunityId: string | null,
): Promise<boolean> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return false;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });
    const model = process.env.AI_FAST_MODEL || "claude-sonnet-4-5";
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const stream = client.messages.stream({
      model,
      max_tokens: 700,
      system:
        "You are EDGE's AI analyst for a cross-market arbitrage terminal. " +
        "Give concise, practical risk and execution guidance. Use short bullets.",
      messages: [
        {
          role: "user",
          content: opportunityId
            ? `Question about arbitrage opportunity ${opportunityId}: ${prompt}`
            : prompt,
        },
      ],
    });

    aiUsage.callsToday += 1;
    for await (const event of stream as AsyncIterable<any>) {
      if (
        event.type === "content_block_delta" &&
        event.delta?.type === "text_delta"
      ) {
        res.write(
          `data: ${JSON.stringify({
            type: "delta",
            text: event.delta.text,
          })}\n\n`,
        );
      }
    }
    const final = await stream.finalMessage();
    aiUsage.inputTokens += final.usage?.input_tokens ?? 0;
    aiUsage.outputTokens += final.usage?.output_tokens ?? 0;
    aiUsage.costToday +=
      ((final.usage?.input_tokens ?? 0) / 1_000_000) * 3 +
      ((final.usage?.output_tokens ?? 0) / 1_000_000) * 15;
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
    return true;
  } catch (err) {
    return false;
  }
}

export function createApiRouter(): Router {
  const router = Router();

  /* ---- AI ---- */
  router.get("/api/ai/status", (_req, res) => {
    res.json(aiStatus());
  });

  router.get("/api/ai/news", (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    res.json({ alerts: newsAlerts(limit) });
  });

  router.post("/api/ai/chat", (req: Request, res: Response) => {
    const id = uuid();
    chatSessions.set(id, {
      opportunityId: req.body?.opportunityId ?? null,
      createdAt: Date.now(),
    });
    res.json({ chatId: id });
  });

  router.post(
    "/api/ai/chat/:chatId/message",
    async (req: Request, res: Response) => {
      const session = chatSessions.get(req.params.chatId);
      const oppId = session?.opportunityId ?? null;
      const message = String(req.body?.message ?? "").slice(0, 4000);
      if (!message) {
        res.status(400).json({ error: "message required" });
        return;
      }
      const ok = await streamAnthropic(res, message, oppId);
      if (!ok) streamText(res, CANNED_REPLY(oppId));
    },
  );

  /* ---- Bots ---- */
  router.get("/api/bots/templates", (_req, res) => {
    res.json({ templates: BOT_TEMPLATES });
  });

  router.get("/api/bots/activity", (_req, res) => {
    res.json({ activity: bots.activityLog() });
  });

  router.get("/api/bots/aggregate", (_req, res) => {
    res.json({ aggregate: bots.aggregate() });
  });

  router.get("/api/bots", (_req, res) => {
    res.json({ bots: bots.list() });
  });

  router.post("/api/bots", (req: Request, res: Response) => {
    res.json({ bot: bots.create(req.body ?? {}) });
  });

  router.patch("/api/bots/:id", (req: Request, res: Response) => {
    const bot = bots.update(req.params.id, req.body ?? {});
    if (!bot) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json({ bot });
  });

  router.delete("/api/bots/:id", (req: Request, res: Response) => {
    res.json({ ok: bots.remove(req.params.id) });
  });

  const lifecycle: Record<string, Parameters<typeof bots.setStatus>[1]> = {
    start: "starting",
    pause: "paused",
    resume: "running",
    stop: "stopping",
  };
  for (const action of Object.keys(lifecycle)) {
    router.post(`/api/bots/:id/${action}`, (req: Request, res: Response) => {
      const bot = bots.setStatus(req.params.id, lifecycle[action]);
      if (!bot) {
        res.status(404).json({ error: "not found" });
        return;
      }
      res.json({ bot });
    });
  }

  /* ---- Opportunities (REST fallback for environments without WS) ---- */
  router.get("/api/opportunities", (_req, res) => {
    res.json({
      opportunities: engine.list(),
      connections: engine.connections(),
      stats: engine.stats(),
    });
  });

  return router;
}
