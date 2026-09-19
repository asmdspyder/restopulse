import pg from "pg";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

function loadEnv() {
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
          if (!process.env[key]) process.env[key] = val;
        }
      }
    });
  }
}
loadEnv();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function clearAllAccounts() {
  await client.connect();
  console.log("Connected to Neon DB. Clearing all user accounts and restaurant data...");

  // Truncate or delete from all user-related and operational tables
  const tables = [
    "checklist_audit_logs",
    "daily_checklist_values",
    "daily_repeatable_rows",
    "daily_checklist_records",
    "checklist_items",
    "checklist_sections",
    "checklist_template_versions",
    "checklist_templates",
    "wastage_records",
    "sales_records",
    "items",
    "categories",
    "wastage_reasons",
    "units",
    "subscriptions",
    "password_resets",
    "users",
    "restaurants"
  ];

  for (const table of tables) {
    try {
      await client.query(`DELETE FROM "${table}";`);
      console.log(`Cleared table: ${table}`);
    } catch (e) {
      console.log(`Could not clear ${table}: ${e.message}`);
    }
  }

  // Ensure Platform Superadmin exists for platform administration
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "AdminSecurePassword123!", 10);
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@wasteflow.io").toLowerCase();

  await client.query(`
    INSERT INTO users (id, name, email, password_hash, role, status)
    VALUES ('00000000-0000-0000-0000-000000000001', 'Platform Administrator', $1, $2, 'superadmin', 'active')
    ON CONFLICT (email) DO UPDATE SET password_hash = $2;
  `, [adminEmail, adminPasswordHash]);

  console.log(`\nPlatform Superadmin preserved: ${adminEmail}`);

  // Re-run vacuum full to reclaim storage immediately
  console.log("Compacting database storage...");
  await client.query("VACUUM FULL ANALYZE;");

  const [dbSize] = (await client.query("SELECT pg_size_pretty(pg_database_size(current_database())) as total_size;")).rows;
  console.log(`Database is completely clean! Current Size: ${dbSize.total_size}`);

  await client.end();
}

clearAllAccounts().catch((err) => {
  console.error("Error clearing accounts:", err);
  process.exit(1);
});
