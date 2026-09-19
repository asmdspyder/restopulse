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

async function run() {
  await client.connect();
  console.log("Running VACUUM FULL ANALYZE on Neon PostgreSQL...");

  // Reclaim dead space
  await client.query("VACUUM FULL ANALYZE;");
  console.log("VACUUM FULL ANALYZE completed successfully!");

  const [dbSize] = (await client.query("SELECT pg_size_pretty(pg_database_size(current_database())) as total_size;")).rows;
  console.log("Reclaimed Total DB Size:", dbSize.total_size);

  await client.end();
}

run().catch((err) => {
  console.error("Vacuum error:", err);
  process.exit(1);
});
