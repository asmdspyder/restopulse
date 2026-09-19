import dns from "dns";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Force IPv4 resolution on Node.js to prevent Windows getaddrinfo ENOTFOUND on dual-stack hosts
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (e) {
  // Ignore if not supported in runtime
}

const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/wastesaas";

// Global pool cache for Next.js hot reloading
declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

let pool: Pool;

const poolConfig = {
  connectionString,
  ssl: connectionString.includes("neon.tech") || connectionString.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

if (process.env.NODE_ENV === "production") {
  pool = new Pool(poolConfig);
} else {
  if (!global.__dbPool) {
    global.__dbPool = new Pool(poolConfig);
  }
  pool = global.__dbPool;
}

export const db = drizzle(pool, { schema });
export { pool };

// Database table auto-initializer for fresh environments
export async function initializeDatabaseSchema() {
  try {
    const client = await pool.connect();
    try {
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
          can_manage_checklists BOOLEAN DEFAULT true NOT NULL,
          last_login_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        ALTER TABLE users ADD COLUMN IF NOT EXISTS can_manage_checklists BOOLEAN DEFAULT true NOT NULL;

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
          is_closed BOOLEAN DEFAULT false NOT NULL,
          notes TEXT,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          CONSTRAINT unique_restaurant_sales_date UNIQUE (restaurant_id, date)
        );

        ALTER TABLE users ADD COLUMN IF NOT EXISTS can_manage_checklists BOOLEAN DEFAULT false;

        CREATE TABLE IF NOT EXISTS checklist_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          code VARCHAR(100) NOT NULL,
          frequency VARCHAR(50) DEFAULT 'daily' NOT NULL,
          target_time VARCHAR(50) DEFAULT '10:00 AM',
          is_active BOOLEAN DEFAULT true NOT NULL,
          current_version NUMERIC(5,0) DEFAULT 1 NOT NULL,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS checklist_template_versions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
          version NUMERIC(5,0) NOT NULL,
          structure_snapshot JSON NOT NULL,
          change_summary TEXT,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS checklist_sections (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
          version NUMERIC(5,0) DEFAULT 1 NOT NULL,
          section_code VARCHAR(20),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          section_type VARCHAR(50) DEFAULT 'checklist' NOT NULL,
          display_order NUMERIC(5,0) DEFAULT 0 NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS checklist_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          section_id UUID NOT NULL REFERENCES checklist_sections(id) ON DELETE CASCADE,
          label VARCHAR(255) NOT NULL,
          description TEXT,
          field_type VARCHAR(50) DEFAULT 'checkbox' NOT NULL,
          options JSON,
          is_required BOOLEAN DEFAULT false NOT NULL,
          allows_remarks BOOLEAN DEFAULT true NOT NULL,
          remarks_required BOOLEAN DEFAULT false NOT NULL,
          default_value TEXT,
          calculation_formula JSON,
          display_order NUMERIC(5,0) DEFAULT 0 NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS daily_checklist_records (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
          template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
          template_version_id UUID REFERENCES checklist_template_versions(id) ON DELETE SET NULL,
          version_number NUMERIC(5,0) DEFAULT 1 NOT NULL,
          date DATE NOT NULL,
          status VARCHAR(50) DEFAULT 'not_started' NOT NULL,
          completion_percent NUMERIC(5,2) DEFAULT 0 NOT NULL,
          completed_items_count NUMERIC(5,0) DEFAULT 0 NOT NULL,
          total_required_items_count NUMERIC(5,0) DEFAULT 0 NOT NULL,
          opening_manager_name VARCHAR(255),
          cashier_name VARCHAR(255),
          verified_by_name VARCHAR(255),
          manager_signature TEXT,
          pending_issues TEXT,
          verified_at TIMESTAMPTZ,
          structure_snapshot JSON,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          CONSTRAINT unique_daily_checklist_date UNIQUE (restaurant_id, template_id, date)
        );

        CREATE TABLE IF NOT EXISTS daily_checklist_values (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          daily_record_id UUID NOT NULL REFERENCES daily_checklist_records(id) ON DELETE CASCADE,
          item_id UUID,
          section_id UUID,
          item_key VARCHAR(150) NOT NULL,
          value_boolean BOOLEAN,
          value_text TEXT,
          value_number NUMERIC(12,2),
          value_json JSON,
          remarks TEXT,
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
          updated_by_name VARCHAR(255),
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          CONSTRAINT unique_daily_checklist_item UNIQUE (daily_record_id, item_key)
        );

        CREATE TABLE IF NOT EXISTS daily_repeatable_rows (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          daily_record_id UUID NOT NULL REFERENCES daily_checklist_records(id) ON DELETE CASCADE,
          section_code VARCHAR(50) NOT NULL,
          row_index NUMERIC(5,0) NOT NULL,
          data JSON NOT NULL,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS checklist_audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          daily_record_id UUID NOT NULL REFERENCES daily_checklist_records(id) ON DELETE CASCADE,
          restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          user_name VARCHAR(255) NOT NULL,
          action VARCHAR(50) NOT NULL,
          section_title VARCHAR(255),
          item_label VARCHAR(255),
          previous_value TEXT,
          new_value TEXT,
          operational_date DATE NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_templates_rest ON checklist_templates(restaurant_id);
        CREATE INDEX IF NOT EXISTS idx_sections_templ ON checklist_sections(template_id);
        CREATE INDEX IF NOT EXISTS idx_items_sect ON checklist_items(section_id);
        CREATE INDEX IF NOT EXISTS idx_daily_records_lookup ON daily_checklist_records(restaurant_id, date);
        CREATE INDEX IF NOT EXISTS idx_daily_values_rec ON daily_checklist_values(daily_record_id);
        CREATE INDEX IF NOT EXISTS idx_audit_rec ON checklist_audit_logs(daily_record_id);
      `);
      console.log("Database tables verified/initialized successfully.");
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn("Database initialization warning:", err);
  }
}
