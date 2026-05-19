// Source for the Vercel serverless function. This file is bundled by
// script/build-api.mjs into a single self-contained `api/[...path].js`
// (all server code + npm deps inlined) so the deployed function has ZERO
// runtime imports — Vercel only ships the api/ folder, so cross-directory
// imports like ../server/* fail with ERR_MODULE_NOT_FOUND otherwise.
import express from "express";
import { createApiRouter } from "./routes";
import { bots } from "./store";

type Req = any;
type Res = any;

let cached: ((req: Req, res: Res) => void) | null = null;

function buildApp(): (req: Req, res: Res) => void {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  // No long-lived process on serverless: advance the bot simulation a
  // step per request. Live market data is fetched (and cached) inside
  // the /api/opportunities handler.
  app.use((_req: Req, _res: Res, next: () => void) => {
    try {
      bots.tick();
    } catch {
      /* non-fatal */
    }
    next();
  });
  app.use(createApiRouter());
  app.use((err: any, _req: Req, res: Res, _next: () => void) => {
    res
      .status(500)
      .json({ error: "handler_error", message: String(err?.message || err) });
  });
  return app as unknown as (req: Req, res: Res) => void;
}

export default function handler(req: Req, res: Res) {
  try {
    if (!cached) cached = buildApp();
    return cached(req, res);
  } catch (err: any) {
    cached = null;
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "init_failure",
        message: String(err?.message || err),
        stack: String(err?.stack || "").split("\n").slice(0, 6),
      }),
    );
  }
}
