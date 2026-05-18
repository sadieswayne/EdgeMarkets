import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { createApiRouter } from "./routes";
import { bots } from "./store";
import { getLiveData } from "./feeds";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(createApiRouter());

const server = createServer(app);

/* ---- WebSocket: live opportunity stream on /ws ---- */
const wss = new WebSocketServer({ server, path: "/ws" });

async function snapshot() {
  const data = await getLiveData();
  return JSON.stringify({
    type: "snapshot",
    opportunities: data.opportunities,
    connections: data.connections,
    stats: data.stats,
    timestamp: Date.now(),
  });
}

wss.on("connection", async (ws) => {
  try {
    ws.send(await snapshot());
  } catch {
    /* client may have closed */
  }
});

setInterval(async () => {
  if (![...wss.clients].some((c) => c.readyState === WebSocket.OPEN)) return;
  const payload = await snapshot();
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}, 3000);

setInterval(() => bots.tick(), 3000);

/* ---- Static client (prod) / Vite dev middleware ---- */
const PORT = Number(process.env.PORT) || 5000;
const isDev = process.env.NODE_ENV !== "production";

async function start() {
  if (isDev) {
    const { setupVite } = await import("./vite");
    await setupVite(server, app);
  } else {
    const clientDir = path.resolve(process.cwd(), "dist", "public");
    app.use(express.static(clientDir));
    app.use("/{*path}", (_req, res) => {
      res.sendFile(path.join(clientDir, "index.html"));
    });
  }

  server.listen(PORT, () => {
    console.log(
      `EDGE terminal running on http://localhost:${PORT}` +
        (isDev ? " (dev)" : " (prod)"),
    );
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log(
        "  ANTHROPIC_API_KEY not set — AI chat uses built-in canned responses.",
      );
    }
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
