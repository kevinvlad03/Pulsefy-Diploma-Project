import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.js";
import tracksRoutes from "./routes/tracks.js";
import healthRoutes from "./routes/health.js";
import jamendoRoutes from "./routes/jamendo.js";
import playlistsRoutes from "./routes/playlists.js";
import listeningEventsRoutes from "./routes/listening-events.js";
import recommendationsRoutes from "./routes/recommendations.js";
import aiRoutes from "./routes/ai.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use("/media", express.static(path.join(projectRoot, "public", "media")));

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/tracks", tracksRoutes);
app.use("/jamendo", jamendoRoutes);
app.use("/playlists", playlistsRoutes);
app.use("/listening-events", listeningEventsRoutes);
app.use("/recommendations", recommendationsRoutes);
app.use("/ai", aiRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Pulsefy API listening on port ${port}`);
});
