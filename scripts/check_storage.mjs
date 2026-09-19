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

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function run() {
  await client.connect();
  console.log("Connected to Neon DB successfully.\n");

  // 1. Total DB Size
  const dbSizeRes = await client.query("SELECT pg_size_pretty(pg_database_size(current_database())) as total_size;");
  console.log("=== TOTAL DATABASE SIZE ===");
  console.log("Current DB Size:", dbSizeRes.rows[0].total_size);

  // 2. Table & Index sizes
  const tableSizesRes = await client.query(`
    SELECT 
      c.relname AS table_name,
      pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
      pg_size_pretty(pg_relation_size(c.oid)) AS table_size,
      pg_size_pretty(pg_indexes_size(c.oid)) AS index_size,
      c.reltuples::bigint AS estimated_rows
    FROM pg_class c
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC;
  `);

  console.log("\n=== TABLE SIZE BREAKDOWN ===");
  console.table(tableSizesRes.rows);

  // 3. Exact row counts
  console.log("\n=== EXACT ROW COUNTS ===");
  for (const row of tableSizesRes.rows) {
    try {
      const countRes = await client.query(`SELECT count(*) FROM "${row.table_name}"`);
      console.log(`${row.table_name.padEnd(32)}: ${countRes.rows[0].count} rows`);
    } catch (e) {
      console.log(`${row.table_name.padEnd(32)}: error`);
    }
  }

  // 4. Check for dead tuples / table bloat
  const bloatRes = await client.query(`
    SELECT 
      relname AS table_name,
      n_live_tup AS live_tuples,
      n_dead_tup AS dead_tuples,
      last_vacuum,
      last_autovacuum
    FROM pg_stat_user_tables
    ORDER BY n_dead_tup DESC;
  `);

  console.log("\n=== DEAD TUPLES / BLOAT STATS ===");
  console.table(bloatRes.rows);

  await client.end();
}

run().catch((err) => {
  console.error("Diagnostic error:", err);
  process.exit(1);
});
