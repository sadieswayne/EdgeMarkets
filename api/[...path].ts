// Vercel serverless entry — catch-all so every /api/* path routes here
// reliably (no rewrite-to-index needed). WebSockets aren't available on
// serverless, so the client polls /api/opportunities for the live feed;
// the bot simulation is advanced one step per request.
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
