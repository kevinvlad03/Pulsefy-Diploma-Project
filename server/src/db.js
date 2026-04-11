import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.resolve(__dirname, "../db");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let initializationPromise;

async function runSqlFile(filename) {
  const sql = await fs.readFile(path.join(dbDir, filename), "utf8");
  if (!sql.trim()) {
    return;
  }
  await pool.query(sql);
}

export function initializeDatabase() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await runSqlFile("bootstrap.sql");
      await runSqlFile("schema.sql");
    })();
  }

  return initializationPromise;
}
