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

const { Pool } = pg;
const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/wastesaas";

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("neon.tech") || connectionString.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Applying menu costing schema migrations...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        purchase_quantity NUMERIC(10,3) NOT NULL,
        purchase_unit VARCHAR(50) NOT NULL,
        purchase_price NUMERIC(10,2) NOT NULL,
        cost_per_base_unit NUMERIC(14,6) NOT NULL,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        selling_price NUMERIC(10,2) DEFAULT 0.00 NOT NULL,
        category VARCHAR(100),
        description TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS menu_item_ingredients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
        quantity NUMERIC(10,3) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS menu_item_steps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
        step_number NUMERIC(5,0) NOT NULL,
        instruction TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant ON ingredients(restaurant_id);
      CREATE INDEX IF NOT EXISTS idx_ingredients_rest_name ON ingredients(restaurant_id, name);
      CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
      CREATE INDEX IF NOT EXISTS idx_menu_items_rest_active ON menu_items(restaurant_id, is_active);
      CREATE INDEX IF NOT EXISTS idx_menu_items_rest_name ON menu_items(restaurant_id, name);
      CREATE INDEX IF NOT EXISTS idx_menu_item_ing_item ON menu_item_ingredients(menu_item_id);
      CREATE INDEX IF NOT EXISTS idx_menu_item_ing_ing ON menu_item_ingredients(ingredient_id);
      CREATE INDEX IF NOT EXISTS idx_menu_item_steps_item ON menu_item_steps(menu_item_id);
      CREATE INDEX IF NOT EXISTS idx_menu_item_steps_order ON menu_item_steps(menu_item_id, step_number);
    `);
    console.log("Menu costing tables and indexes successfully created in database!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
