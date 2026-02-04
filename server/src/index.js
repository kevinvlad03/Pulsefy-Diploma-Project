import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import tracksRoutes from "./routes/tracks.js";
import healthRoutes from "./routes/health.js";
import jamendoRoutes from "./routes/jamendo.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/tracks", tracksRoutes);
app.use("/jamendo", jamendoRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Pulsefy API listening on port ${port}`);
});
