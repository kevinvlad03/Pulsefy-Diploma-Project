import jwt from "jsonwebtoken";
import { pool } from "../db.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    try {
      const row = await pool.query("SELECT subscription_tier FROM users WHERE id = $1", [payload.id]);
      req.user.subscription_tier = row.rows[0]?.subscription_tier ?? "free";
    } catch {
      req.user.subscription_tier = "free";
    }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid auth token" });
  }
}
