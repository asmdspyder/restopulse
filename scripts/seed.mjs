import pg from "pg";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Load .env file
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

console.log("Using Database URL:", connectionString.replace(/:[^:@]+@/, ":****@"));

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("neon.tech") || connectionString.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

async function runSeed() {
  console.log("Connecting to database for seeding...");
  const client = await pool.connect();

  try {
    // 1. Initialize tables if not already present
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS restaurants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(50) NOT NULL,
        address TEXT,
        currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
        timezone VARCHAR(100) DEFAULT 'Asia/Kolkata' NOT NULL,
        account_status VARCHAR(50) DEFAULT 'active' NOT NULL,
        shifts_enabled BOOLEAN DEFAULT false NOT NULL,
        shift_names JSON DEFAULT '["Morning", "Evening"]'::json,
        responsible_areas JSON DEFAULT '["Kitchen", "Bar", "Bakery", "Service", "Storage", "Other"]'::json,
        onboarding_completed BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin' NOT NULL,
        status VARCHAR(50) DEFAULT 'active' NOT NULL,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        razorpay_subscription_id VARCHAR(255),
        razorpay_customer_id VARCHAR(255),
        razorpay_plan_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        plan_type VARCHAR(50) DEFAULT 'monthly' NOT NULL,
        billing_interval VARCHAR(50) DEFAULT 'month' NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
        status VARCHAR(50) DEFAULT 'active' NOT NULL,
        current_period_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        current_period_end TIMESTAMPTZ NOT NULL,
        next_billing_at TIMESTAMPTZ,
        cancelled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        is_default BOOLEAN DEFAULT false NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        symbol VARCHAR(20) NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        default_unit VARCHAR(50) DEFAULT 'kg' NOT NULL,
        cost_per_unit NUMERIC(10,2) NOT NULL,
        default_responsible_area VARCHAR(100) DEFAULT 'Kitchen',
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS wastage_reasons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        is_default BOOLEAN DEFAULT false NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS wastage_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        reason_id UUID NOT NULL REFERENCES wastage_reasons(id) ON DELETE RESTRICT,
        item_name_snapshot VARCHAR(255) NOT NULL,
        category_name_snapshot VARCHAR(100),
        reason_name_snapshot VARCHAR(100) NOT NULL,
        quantity NUMERIC(10,3) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        rate_per_unit NUMERIC(10,2) NOT NULL,
        wastage_value NUMERIC(10,2) NOT NULL,
        shift VARCHAR(50),
        responsible_area VARCHAR(100),
        notes TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        recorded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sales_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        sales_amount NUMERIC(12,2) NOT NULL,
        notes TEXT,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT unique_restaurant_sales_date UNIQUE (restaurant_id, date)
      );
    `);

    console.log("Database tables verified.");

    // 2. Upsert Superadmin User
    const adminPasswordHash = await bcrypt.hash("AdminSecurePassword123!", 10);
    await client.query(`
      INSERT INTO users (email, name, password_hash, role, status)
      VALUES ('admin@wasteflow.io', 'SaaS Administrator', $1, 'superadmin', 'active')
      ON CONFLICT (email) DO UPDATE SET password_hash = $1;
    `, [adminPasswordHash]);
    console.log("Superadmin account ready: admin@wasteflow.io / AdminSecurePassword123!");

    // 3. Upsert Demo Restaurant: "Indiranagar Bistro & Café"
    const bistroEmail = "chef@indiranagarbistro.com";
    const bistroPassHash = await bcrypt.hash("BistroPassword123!", 10);

    let restRes = await client.query(`
      SELECT id FROM restaurants WHERE email = $1;
    `, [bistroEmail]);

    let restaurantId;
    if (restRes.rows.length === 0) {
      const newRest = await client.query(`
        INSERT INTO restaurants (business_name, contact_name, email, phone, address, currency, timezone, account_status, onboarding_completed)
        VALUES ('Indiranagar Bistro & Café', 'Chef Vikram Roy', $1, '+91 98860 12345', '100ft Road, Indiranagar, Bengaluru', 'INR', 'Asia/Kolkata', 'active', true)
        RETURNING id;
      `, [bistroEmail]);
      restaurantId = newRest.rows[0].id;
    } else {
      restaurantId = restRes.rows[0].id;
    }

    // Demo Owner User
    const userRes = await client.query(`
      INSERT INTO users (restaurant_id, name, email, password_hash, role, status)
      VALUES ($1, 'Chef Vikram Roy', $2, $3, 'admin', 'active')
      ON CONFLICT (email) DO UPDATE SET restaurant_id = $1, password_hash = $3
      RETURNING id;
    `, [restaurantId, bistroEmail, bistroPassHash]);
    const userId = userRes.rows[0].id;

    // Demo Subscription
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    await client.query(`
      INSERT INTO subscriptions (restaurant_id, plan_type, billing_interval, amount, currency, status, current_period_start, current_period_end, next_billing_at)
      VALUES ($1, 'yearly', 'year', 1999.00, 'INR', 'active', NOW(), $2, $2)
      ON CONFLICT DO NOTHING;
    `, [restaurantId, oneYearLater]);

    // Categories
    const categoriesList = ["Food", "Beverage", "Ingredient", "Packaging", "Other"];
    const catMap = {};
    for (const c of categoriesList) {
      const res = await client.query(`
        INSERT INTO categories (restaurant_id, name, is_default, is_active)
        VALUES ($1, $2, true, true)
        ON CONFLICT DO NOTHING
        RETURNING id, name;
      `, [restaurantId, c]);
      if (res.rows.length > 0) {
        catMap[c] = res.rows[0].id;
      } else {
        const existing = await client.query(`SELECT id FROM categories WHERE restaurant_id = $1 AND name = $2`, [restaurantId, c]);
        catMap[c] = existing.rows[0]?.id;
      }
    }

    // Units
    const unitsList = [
      { name: "Kilogram", symbol: "kg" },
      { name: "Gram", symbol: "g" },
      { name: "Liter", symbol: "L" },
      { name: "Milliliter", symbol: "ml" },
      { name: "Pieces", symbol: "pcs" },
      { name: "Portion", symbol: "portion" },
      { name: "Pack", symbol: "pack" },
      { name: "Bottle", symbol: "bottle" },
      { name: "Tray", symbol: "tray" },
    ];
    for (const u of unitsList) {
      await client.query(`
        INSERT INTO units (restaurant_id, name, symbol, is_active)
        VALUES ($1, $2, $3, true)
        ON CONFLICT DO NOTHING;
      `, [restaurantId, u.name, u.symbol]);
    }

    // Reasons
    const reasonsList = [
      "Over-preparation",
      "Over-portioning",
      "Spoilage",
      "Expired",
      "Burnt / Cooking error",
      "Wrong order",
      "Remake",
      "Trimming loss",
      "Spillage",
      "Damaged",
      "Staff meal",
      "Other",
    ];
    const reasonMap = {};
    for (const r of reasonsList) {
      const res = await client.query(`
        INSERT INTO wastage_reasons (restaurant_id, name, is_default, is_active)
        VALUES ($1, $2, true, true)
        ON CONFLICT DO NOTHING
        RETURNING id, name;
      `, [restaurantId, r]);
      if (res.rows.length > 0) {
        reasonMap[r] = res.rows[0].id;
      } else {
        const existing = await client.query(`SELECT id FROM wastage_reasons WHERE restaurant_id = $1 AND name = $2`, [restaurantId, r]);
        reasonMap[r] = existing.rows[0]?.id;
      }
    }

    // Items
    const sampleItems = [
      { name: "Cooked Rice", cat: "Food", unit: "kg", cost: 95.0, area: "Kitchen" },
      { name: "Chicken Breast", cat: "Ingredient", unit: "kg", cost: 320.0, area: "Kitchen" },
      { name: "Fresh Milk", cat: "Beverage", unit: "L", cost: 65.0, area: "Bar" },
      { name: "Specialty Coffee Beans", cat: "Beverage", unit: "kg", cost: 950.0, area: "Bar" },
      { name: "Butter Croissant", cat: "Food", unit: "pcs", cost: 45.0, area: "Bakery" },
      { name: "Tomato Sauce / Gravy", cat: "Ingredient", unit: "L", cost: 140.0, area: "Kitchen" },
      { name: "Takeaway Containers", cat: "Packaging", unit: "pcs", cost: 8.5, area: "Service" },
      { name: "Salmon Fillet", cat: "Ingredient", unit: "kg", cost: 1200.0, area: "Kitchen" },
      { name: "Burger Buns", cat: "Ingredient", unit: "pcs", cost: 18.0, area: "Kitchen" },
      { name: "Whipping Cream", cat: "Ingredient", unit: "L", cost: 240.0, area: "Bakery" },
    ];

    const itemMap = {};
    for (const item of sampleItems) {
      const catId = catMap[item.cat] || catMap["Food"];
      const res = await client.query(`
        INSERT INTO items (restaurant_id, name, category_id, default_unit, cost_per_unit, default_responsible_area, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT DO NOTHING
        RETURNING id, name;
      `, [restaurantId, item.name, catId, item.unit, item.cost, item.area]);

      if (res.rows.length > 0) {
        itemMap[item.name] = { id: res.rows[0].id, ...item, categoryId: catId };
      } else {
        const existing = await client.query(`SELECT id FROM items WHERE restaurant_id = $1 AND name = $2`, [restaurantId, item.name]);
        itemMap[item.name] = { id: existing.rows[0]?.id, ...item, categoryId: catId };
      }
    }

    // Historical Records Generation (for rich demo analytics)
    const existingCount = await client.query(`SELECT count(*)::int FROM wastage_records WHERE restaurant_id = $1`, [restaurantId]);
    if (existingCount.rows[0].count === 0) {
      console.log("Generating rich realistic demo wastage and sales logs...");
      const now = new Date();

      // Seed 30 days of sales
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateIso = d.toISOString().split("T")[0];
        const dayOfWeek = d.getDay();
        // Higher sales on weekends (Fri, Sat, Sun)
        const baseSales = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0 ? 55000 : 38000;
        const salesAmt = baseSales + Math.floor(Math.random() * 8000) - 4000;

        await client.query(`
          INSERT INTO sales_records (restaurant_id, date, sales_amount, created_by)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (restaurant_id, date) DO NOTHING;
        `, [restaurantId, dateIso, salesAmt, userId]);
      }

      // Seed Wastage events across past 30 days
      const demoEvents = [
        { item: "Cooked Rice", qty: 3.5, reason: "Over-preparation", area: "Kitchen", daysAgo: 0 },
        { item: "Chicken Breast", qty: 1.2, reason: "Spoilage", area: "Kitchen", daysAgo: 0 },
        { item: "Fresh Milk", qty: 2.0, reason: "Expired", area: "Bar", daysAgo: 1 },
        { item: "Butter Croissant", qty: 6, reason: "Over-preparation", area: "Bakery", daysAgo: 1 },
        { item: "Tomato Sauce / Gravy", qty: 2.5, reason: "Burnt / Cooking error", area: "Kitchen", daysAgo: 2 },
        { item: "Cooked Rice", qty: 4.0, reason: "Over-preparation", area: "Kitchen", daysAgo: 3 },
        { item: "Salmon Fillet", qty: 0.8, reason: "Trimming loss", area: "Kitchen", daysAgo: 4 },
        { item: "Specialty Coffee Beans", qty: 0.5, reason: "Spillage", area: "Bar", daysAgo: 4 },
        { item: "Burger Buns", qty: 12, reason: "Expired", area: "Kitchen", daysAgo: 5 },
        { item: "Whipping Cream", qty: 1.5, reason: "Spoilage", area: "Bakery", daysAgo: 6 },
        { item: "Chicken Breast", qty: 2.0, reason: "Over-preparation", area: "Kitchen", daysAgo: 7 },
        { item: "Cooked Rice", qty: 5.0, reason: "Over-preparation", area: "Kitchen", daysAgo: 8 },
        { item: "Butter Croissant", qty: 8, reason: "Over-preparation", area: "Bakery", daysAgo: 9 },
        { item: "Tomato Sauce / Gravy", qty: 3.0, reason: "Spoilage", area: "Kitchen", daysAgo: 10 },
        { item: "Fresh Milk", qty: 3.0, reason: "Expired", area: "Bar", daysAgo: 12 },
        { item: "Salmon Fillet", qty: 1.2, reason: "Wrong order", area: "Kitchen", daysAgo: 14 },
        { item: "Cooked Rice", qty: 4.5, reason: "Over-preparation", area: "Kitchen", daysAgo: 15 },
        { item: "Chicken Breast", qty: 1.8, reason: "Burnt / Cooking error", area: "Kitchen", daysAgo: 18 },
        { item: "Takeaway Containers", qty: 15, reason: "Damaged", area: "Service", daysAgo: 20 },
        { item: "Cooked Rice", qty: 3.0, reason: "Over-preparation", area: "Kitchen", daysAgo: 22 },
        { item: "Specialty Coffee Beans", qty: 0.4, reason: "Spillage", area: "Bar", daysAgo: 25 },
      ];

      for (const ev of demoEvents) {
        const it = itemMap[ev.item];
        if (!it) continue;
        const reasonId = reasonMap[ev.reason] || Object.values(reasonMap)[0];
        const val = parseFloat((ev.qty * it.cost).toFixed(2));
        const recDate = new Date(now);
        recDate.setDate(recDate.getDate() - ev.daysAgo);
        recDate.setHours(14, 30, 0, 0);

        await client.query(`
          INSERT INTO wastage_records (
            restaurant_id, item_id, category_id, reason_id,
            item_name_snapshot, category_name_snapshot, reason_name_snapshot,
            quantity, unit, rate_per_unit, wastage_value,
            responsible_area, recorded_at, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14);
        `, [
          restaurantId,
          it.id,
          it.categoryId,
          reasonId,
          it.name,
          it.cat,
          ev.reason,
          ev.qty,
          it.unit,
          it.cost,
          val,
          ev.area,
          recDate,
          userId,
        ]);
      }
    }

    console.log("Seeding completed successfully!");
    console.log("Restaurant Demo Account: chef@indiranagarbistro.com / BistroPassword123!");
    console.log("Admin Demo Account: admin@wasteflow.io / AdminSecurePassword123!");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed();
