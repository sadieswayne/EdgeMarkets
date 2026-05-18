import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { createApiRouter } from "./routes";
import { engine, bots } from "./store";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(createApiRouter());

const server = createServer(app);

/* ---- WebSocket: live opportunity stream on /ws ---- */
const wss = new WebSocketServer({ server, path: "/ws" });

function snapshot() {
  return JSON.stringify({
    type: "snapshot",
    opportunities: engine.list(),
    connections: engine.connections(),
    stats: engine.stats(),
    timestamp: Date.now(),
  });
}

wss.on("connection", (ws) => {
  ws.send(snapshot());
});

setInterval(() => {
  engine.tick();
  const payload = snapshot();
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
}, 2000);

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
