// Vercel serverless entry. Handles every /api/* request via the shared
// Express router. WebSockets aren't available on serverless, so the client
// falls back to its built-in live data generator; the bot/opportunity
// simulation is advanced opportunistically on each request instead.
import express from "express";
import { createApiRouter } from "../server/routes";
import { engine, bots } from "../server/store";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use((_req, _res, next) => {
  engine.tick();
  bots.tick();
  next();
});
app.use(createApiRouter());

export default function handler(req: unknown, res: unknown) {
  return (app as unknown as (req: unknown, res: unknown) => void)(req, res);
}
