// Vercel serverless entry. Handles every /api/* request via the shared
// Express router. WebSockets aren't available on serverless, so the client
// falls back to its built-in live data generator; the bot/opportunity
// simulation is advanced opportunistically on each request instead.
import express from "express";
import { createApiRouter } from "../server/routes";
import { bots } from "../server/store";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
// No long-lived process on serverless: advance the bot simulation a step
// per request. Live market data is fetched (and cached) inside the
// /api/opportunities handler itself.
app.use((_req, _res, next) => {
  bots.tick();
  next();
});
app.use(createApiRouter());

export default function handler(req: unknown, res: unknown) {
  return (app as unknown as (req: unknown, res: unknown) => void)(req, res);
}
