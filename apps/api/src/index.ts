import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import eventsRouter from "./routes/events.js";
import incidentsRouter from "./routes/incidents.js";
import dashboardRouter from "./routes/dashboard.js";
import { requireApiKey } from "./middleware/auth.js";

const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*" }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// All /v1 routes require an API key
app.use("/v1", requireApiKey);
app.use("/v1/events", eventsRouter);
app.use("/v1/incidents", incidentsRouter);
app.use("/v1/dashboard", dashboardRouter);

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found." }));

// Error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[api] unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

const PORT = Number(process.env.PORT || 3100);
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/commerce-watchdog";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`[api] Connected to MongoDB: ${MONGO_URI}`);
    app.listen(PORT, () => console.log(`[api] Commerce Watchdog API listening on :${PORT}`));
  })
  .catch((err) => {
    console.error("[api] MongoDB connection failed:", err);
    process.exit(1);
  });

export default app;
