// Vercel serverless entry — catch-all so every /api/* path routes here
// reliably. WebSockets aren't available on serverless, so the client polls
// /api/opportunities for the live feed; the bot simulation is advanced one
// step per request.
//
// The Express app is built lazily inside the handler and wrapped in a
// try/catch so any module-load or runtime failure returns a readable JSON
// error instead of an opaque Vercel FUNCTION_INVOCATION_FAILED.

type Req = any;
type Res = any;

let appPromise: Promise<(req: Req, res: Res) => void> | null = null;

async function buildApp(): Promise<(req: Req, res: Res) => void> {
  const { default: express } = await import("express");
  const { createApiRouter } = await import("../server/routes");
  const { bots } = await import("../server/store");

  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use((_req: Req, _res: Res, next: () => void) => {
    try {
      bots.tick();
    } catch {
      /* non-fatal */
    }
    next();
  });
  app.use(createApiRouter());
  // Express-level error handler: never crash the function.
  app.use((err: any, _req: Req, res: Res, _next: () => void) => {
    res
      .status(500)
      .json({ error: "handler_error", message: String(err?.message || err) });
  });
  return app as unknown as (req: Req, res: Res) => void;
}

export default async function handler(req: Req, res: Res) {
  try {
    if (!appPromise) appPromise = buildApp();
    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    appPromise = null; // allow retry on next invocation
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
