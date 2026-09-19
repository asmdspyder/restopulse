import pg from "pg";
import fs from "fs";
import path from "path";

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=");
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  } catch (e) {
    console.error("Error reading .env:", e);
  }
}

loadEnv();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function cleanup() {
  await client.connect();
  console.log("Connected to Neon DB.");

  // Check legacy tables to drop
  const legacyTables = [
    "user",
    "account",
    "session",
    "verification",
    "organization",
    "member",
    "invitation",
    "jwks",
    "project_config"
  ];

  console.log("Dropping unused legacy tables...");
  for (const t of legacyTables) {
    try {
      await client.query(`DROP TABLE IF EXISTS "${t}" CASCADE;`);
      console.log(`Dropped legacy table: "${t}"`);
    } catch (e) {
      console.log(`Table "${t}" skipped: ${e.message}`);
    }
  }

  // Re-index public schema
  console.log("Re-indexing database...");
  await client.query("REINDEX SCHEMA public;");

  // Vacuum full
  console.log("Vacuuming full database...");
  await client.query("VACUUM FULL ANALYZE;");

  const [dbSize] = (await client.query("SELECT pg_size_pretty(pg_database_size(current_database())) as total_size;")).rows;
  console.log("Final PostgreSQL Database Size:", dbSize.total_size);

  await client.end();
}

cleanup().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
