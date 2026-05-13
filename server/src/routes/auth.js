import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const updateMeSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(280).nullable().optional(),
});

router.post("/register", asyncHandler(async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { email, name, password } = parse.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, bio, subscription_tier, created_at",
      [email, name, passwordHash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already registered" });
    }
    return res.status(500).json({ error: "Registration failed" });
  }
}));

router.post("/login", asyncHandler(async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const { email, password } = parse.data;
  const result = await pool.query(
    "SELECT id, email, name, bio, subscription_tier, password_hash, created_at FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return res.json({
    user: { id: user.id, email: user.email, name: user.name, bio: user.bio, subscription_tier: user.subscription_tier, created_at: user.created_at },
    token,
  });
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    "SELECT id, email, name, bio, subscription_tier, created_at FROM users WHERE id = $1",
    [req.user.id]
  );
  const user = result.rows[0];
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user });
}));

router.post("/upgrade", requireAuth, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `UPDATE users SET subscription_tier = 'premium' WHERE id = $1
     RETURNING id, email, name, bio, subscription_tier, created_at`,
    [req.user.id]
  );
  return res.json({ user: result.rows[0] });
}));

router.patch("/me", requireAuth, asyncHandler(async (req, res) => {
  const parse = updateMeSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  const updates = [];
  const values = [];

  if (typeof parse.data.name === "string") {
    values.push(parse.data.name.trim());
    updates.push(`name = $${values.length}`);
  }

  if (Object.prototype.hasOwnProperty.call(parse.data, "bio")) {
    values.push(parse.data.bio ? parse.data.bio.trim() : null);
    updates.push(`bio = $${values.length}`);
  }

  if (!updates.length) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  values.push(req.user.id);
  const result = await pool.query(
    `UPDATE users
     SET ${updates.join(", ")}
     WHERE id = $${values.length}
     RETURNING id, email, name, bio, created_at`,
    values
  );

  return res.json({ user: result.rows[0] });
}));

export default router;
