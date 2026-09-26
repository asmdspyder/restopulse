import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  boolean,
  date,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. RESTAURANTS / ACCOUNTS
export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessName: varchar("business_name", { length: 255 }).notNull(),
    contactName: varchar("contact_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 50 }).notNull(),
    address: text("address"),
    currency: varchar("currency", { length: 10 }).default("INR").notNull(),
    timezone: varchar("timezone", { length: 100 }).default("Asia/Kolkata").notNull(),
    accountStatus: varchar("account_status", { length: 50 })
      .default("active")
      .notNull(), // 'active' | 'manually_deactivated'
    shiftsEnabled: boolean("shifts_enabled").default(false).notNull(),
    shiftNames: json("shift_names").$type<string[]>().default(["Morning", "Evening"]),
    responsibleAreas: json("responsible_areas")
      .$type<string[]>()
      .default(["Kitchen", "Bar", "Bakery", "Service", "Storage", "Other"]),
    onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_restaurants_email").on(table.email),
    index("idx_restaurants_status").on(table.accountStatus),
    index("idx_restaurants_created_at").on(table.createdAt),
  ]
);

// 2. USERS
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id").references(() => restaurants.id, {
      onDelete: "cascade",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    role: varchar("role", { length: 50 }).default("admin").notNull(), // 'superadmin' | 'admin' | 'staff'
    canManageChecklists: boolean("can_manage_checklists").default(false).notNull(),
    status: varchar("status", { length: 50 }).default("active").notNull(), // 'active' | 'inactive'
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_users_restaurant_id").on(table.restaurantId),
    index("idx_users_email").on(table.email),
    index("idx_users_rest_status").on(table.restaurantId, table.status),
    index("idx_users_rest_role").on(table.restaurantId, table.role),
  ]
);

// 3. SUBSCRIPTIONS
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 255 }),
    razorpayCustomerId: varchar("razorpay_customer_id", { length: 255 }),
    razorpayPlanId: varchar("razorpay_plan_id", { length: 255 }),
    razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
    planType: varchar("plan_type", { length: 50 }).default("monthly").notNull(), // 'monthly' | 'yearly'
    billingInterval: varchar("billing_interval", { length: 50 }).default("month").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // 199.00 or 1999.00
    currency: varchar("currency", { length: 10 }).default("INR").notNull(),
    status: varchar("status", { length: 50 }).default("active").notNull(), // 'created' | 'active' | 'cancelled' | 'expired' | 'halted'
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).defaultNow().notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
    nextBillingAt: timestamp("next_billing_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_subscriptions_restaurant_id").on(table.restaurantId),
    index("idx_subscriptions_status").on(table.status),
    index("idx_subscriptions_razorpay_sub").on(table.razorpaySubscriptionId),
    index("idx_subscriptions_rest_status").on(table.restaurantId, table.status),
  ]
);

// 4. CATEGORIES
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_categories_restaurant").on(table.restaurantId),
    index("idx_categories_rest_active").on(table.restaurantId, table.isActive),
  ]
);

// 5. UNITS
export const units = pgTable(
  "units",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id").references(() => restaurants.id, {
      onDelete: "cascade",
    }), // Nullable for global standard units
    name: varchar("name", { length: 50 }).notNull(), // e.g., 'Kilogram', 'Liter', 'Pieces'
    symbol: varchar("symbol", { length: 20 }).notNull(), // e.g., 'kg', 'L', 'pcs', 'portion', 'pack', 'bottle', 'tray', 'g', 'ml'
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_units_restaurant").on(table.restaurantId),
    index("idx_units_rest_active").on(table.restaurantId, table.isActive),
  ]
);

// 6. ITEMS
export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    defaultUnit: varchar("default_unit", { length: 50 }).default("kg").notNull(), // 'kg', 'g', 'L', 'ml', 'pcs', etc.
    costPerUnit: numeric("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
    defaultResponsibleArea: varchar("default_responsible_area", { length: 100 }).default("Kitchen"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_items_restaurant").on(table.restaurantId),
    index("idx_items_category").on(table.categoryId),
    index("idx_items_rest_active").on(table.restaurantId, table.isActive),
    index("idx_items_rest_name").on(table.restaurantId, table.name),
  ]
);

// 7. WASTAGE REASONS
export const wastageReasons = pgTable(
  "wastage_reasons",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_reasons_restaurant").on(table.restaurantId),
    index("idx_reasons_rest_active").on(table.restaurantId, table.isActive),
  ]
);

// 8. WASTAGE RECORDS (CORE TRANSACTIONAL ENTITY)
export const wastageRecords = pgTable(
  "wastage_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    itemId: uuid("item_id").references(() => items.id, { onDelete: "restrict" }).notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    reasonId: uuid("reason_id")
      .references(() => wastageReasons.id, { onDelete: "restrict" })
      .notNull(),
    itemNameSnapshot: varchar("item_name_snapshot", { length: 255 }).notNull(),
    categoryNameSnapshot: varchar("category_name_snapshot", { length: 100 }),
    reasonNameSnapshot: varchar("reason_name_snapshot", { length: 100 }).notNull(),
    quantity: numeric("quantity", { precision: 10, scale: 3 }).notNull(),
    unit: varchar("unit", { length: 50 }).notNull(),
    ratePerUnit: numeric("rate_per_unit", { precision: 10, scale: 2 }).notNull(), // Historical price snapshot
    wastageValue: numeric("wastage_value", { precision: 10, scale: 2 }).notNull(), // quantity * rate_per_unit snapshot
    shift: varchar("shift", { length: 50 }),
    responsibleArea: varchar("responsible_area", { length: 100 }),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_wastage_rest_recorded").on(table.restaurantId, table.recordedAt),
    index("idx_wastage_rest_item").on(table.restaurantId, table.itemId),
    index("idx_wastage_rest_reason").on(table.restaurantId, table.reasonId),
    index("idx_wastage_rest_category").on(table.restaurantId, table.categoryId),
    index("idx_wastage_rest_created_by").on(table.restaurantId, table.createdBy),
    index("idx_wastage_rest_area").on(table.restaurantId, table.responsibleArea),
    index("idx_wastage_item").on(table.itemId),
    index("idx_wastage_reason").on(table.reasonId),
    index("idx_wastage_category").on(table.categoryId),
    index("idx_wastage_item_name").on(table.restaurantId, table.itemNameSnapshot),
  ]
);

// 9. SALES RECORDS (DAILY SALES)
export const salesRecords = pgTable(
  "sales_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(),
    salesAmount: numeric("sales_amount", { precision: 12, scale: 2 }).notNull(),
    isClosed: boolean("is_closed").default(false).notNull(),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_sales_restaurant_date").on(table.restaurantId, table.date),
    index("idx_sales_restaurant").on(table.restaurantId),
    index("idx_sales_rest_date").on(table.restaurantId, table.date),
  ]
);

// 10. PASSWORD RESETS
export const passwordResets = pgTable(
  "password_resets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_password_resets_token").on(table.token),
    index("idx_password_resets_user").on(table.userId),
  ]
);

// 11. CHECKLIST TEMPLATES
export const checklistTemplates = pgTable(
  "checklist_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    code: varchar("code", { length: 100 }).notNull(), // 'OPENING_CHECKLIST', 'CLOSING_CHECKLIST', etc.
    frequency: varchar("frequency", { length: 50 }).default("daily").notNull(),
    targetTime: varchar("target_time", { length: 50 }).default("10:00 AM"),
    isActive: boolean("is_active").default(true).notNull(),
    currentVersion: numeric("current_version", { precision: 5, scale: 0 }).default("1").notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_templates_restaurant").on(table.restaurantId),
    index("idx_templates_code").on(table.code),
    index("idx_templates_rest_active").on(table.restaurantId, table.isActive),
    index("idx_templates_rest_code").on(table.restaurantId, table.code),
  ]
);

// 12. CHECKLIST TEMPLATE VERSIONS (IMMUTABLE SNAPSHOTS FOR HISTORICAL INTEGRITY)
export const checklistTemplateVersions = pgTable(
  "checklist_template_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .references(() => checklistTemplates.id, { onDelete: "cascade" })
      .notNull(),
    version: numeric("version", { precision: 5, scale: 0 }).notNull(),
    structureSnapshot: json("structure_snapshot").$type<any>().notNull(),
    changeSummary: text("change_summary"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_template_versions_template").on(table.templateId, table.version),
  ]
);

// 13. CHECKLIST SECTIONS
export const checklistSections = pgTable(
  "checklist_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .references(() => checklistTemplates.id, { onDelete: "cascade" })
      .notNull(),
    version: numeric("version", { precision: 5, scale: 0 }).default("1").notNull(),
    sectionCode: varchar("section_code", { length: 20 }), // 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    sectionType: varchar("section_type", { length: 50 }).default("checklist").notNull(), // 'checklist' | 'table_purchase' | 'table_expense' | 'opening_cash' | 'summary' | 'verification' | 'custom'
    displayOrder: numeric("display_order", { precision: 5, scale: 0 }).default("0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_sections_template").on(table.templateId),
    index("idx_sections_templ_order").on(table.templateId, table.displayOrder),
  ]
);

// 14. CHECKLIST ITEMS / FIELDS
export const checklistItems = pgTable(
  "checklist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sectionId: uuid("section_id")
      .references(() => checklistSections.id, { onDelete: "cascade" })
      .notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    description: text("description"),
    fieldType: varchar("field_type", { length: 50 }).default("checkbox").notNull(), // 'checkbox' | 'short_text' | 'long_text' | 'number' | 'currency' | 'date' | 'time' | 'yes_no' | 'select' | 'signature'
    options: json("options").$type<string[]>(), // For dropdown options
    isRequired: boolean("is_required").default(false).notNull(),
    allowsRemarks: boolean("allows_remarks").default(true).notNull(),
    remarksRequired: boolean("remarks_required").default(false).notNull(),
    defaultValue: text("default_value"),
    calculationFormula: json("calculation_formula").$type<any>(),
    displayOrder: numeric("display_order", { precision: 5, scale: 0 }).default("0").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_items_section").on(table.sectionId),
    index("idx_items_sect_order").on(table.sectionId, table.displayOrder),
  ]
);

// 15. DAILY CHECKLIST RECORDS (PER-DATE OPERATIONAL RECORD)
export const dailyChecklistRecords = pgTable(
  "daily_checklist_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    templateId: uuid("template_id")
      .references(() => checklistTemplates.id, { onDelete: "cascade" })
      .notNull(),
    templateVersionId: uuid("template_version_id").references(() => checklistTemplateVersions.id, { onDelete: "set null" }),
    versionNumber: numeric("version_number", { precision: 5, scale: 0 }).default("1").notNull(),
    date: date("date").notNull(), // '2026-09-14'
    status: varchar("status", { length: 50 }).default("not_started").notNull(), // 'not_started' | 'in_progress' | 'completed' | 'overdue'
    completionPercent: numeric("completion_percent", { precision: 5, scale: 2 }).default("0").notNull(),
    completedItemsCount: numeric("completed_items_count", { precision: 5, scale: 0 }).default("0").notNull(),
    totalRequiredItemsCount: numeric("total_required_items_count", { precision: 5, scale: 0 }).default("0").notNull(),
    openingManagerName: varchar("opening_manager_name", { length: 255 }),
    cashierName: varchar("cashier_name", { length: 255 }),
    verifiedByName: varchar("verified_by_name", { length: 255 }),
    managerSignature: text("manager_signature"),
    pendingIssues: text("pending_issues"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    structureSnapshot: json("structure_snapshot").$type<any>(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_daily_records_unique").on(table.restaurantId, table.templateId, table.date),
    index("idx_daily_records_lookup").on(table.restaurantId, table.date),
    index("idx_daily_records_status").on(table.status),
    index("idx_daily_records_rest_status").on(table.restaurantId, table.status),
    index("idx_daily_records_template").on(table.templateId),
  ]
);

// 16. DAILY CHECKLIST VALUES (CURRENT FIELD VALUES)
export const dailyChecklistValues = pgTable(
  "daily_checklist_values",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dailyRecordId: uuid("daily_record_id")
      .references(() => dailyChecklistRecords.id, { onDelete: "cascade" })
      .notNull(),
    itemId: uuid("item_id"),
    sectionId: uuid("section_id"),
    itemKey: varchar("item_key", { length: 150 }).notNull(),
    valueBoolean: boolean("value_boolean"),
    valueText: text("value_text"),
    valueNumber: numeric("value_number", { precision: 12, scale: 2 }),
    valueJson: json("value_json").$type<any>(),
    remarks: text("remarks"),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedByName: varchar("updated_by_name", { length: 255 }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_daily_values_unique").on(table.dailyRecordId, table.itemKey),
    index("idx_daily_values_record").on(table.dailyRecordId),
    index("idx_daily_values_rec_item").on(table.dailyRecordId, table.itemId),
  ]
);

// 17. DAILY REPEATABLE ROWS (FOR PURCHASE & EXPENSE TABLES)
export const dailyRepeatableRows = pgTable(
  "daily_repeatable_rows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dailyRecordId: uuid("daily_record_id")
      .references(() => dailyChecklistRecords.id, { onDelete: "cascade" })
      .notNull(),
    sectionCode: varchar("section_code", { length: 50 }).notNull(), // 'purchase' | 'expense' | custom
    rowIndex: numeric("row_index", { precision: 5, scale: 0 }).notNull(),
    data: json("data").$type<any>().notNull(), // { item, qty, vendor, amount, paymentMode } or { expense, amount, remarks }
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_repeatable_record_sec").on(table.dailyRecordId, table.sectionCode),
    index("idx_repeatable_rec_sec_row").on(table.dailyRecordId, table.sectionCode, table.rowIndex),
  ]
);

// 18. CHECKLIST AUDIT LOGS (TAMPER-EVIDENT OPERATIONAL LOG)
export const checklistAuditLogs = pgTable(
  "checklist_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dailyRecordId: uuid("daily_record_id")
      .references(() => dailyChecklistRecords.id, { onDelete: "cascade" })
      .notNull(),
    restaurantId: uuid("restaurant_id")
      .references(() => restaurants.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    userName: varchar("user_name", { length: 255 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(), // 'check' | 'uncheck' | 'edit_value' | 'edit_remarks' | 'add_row' | 'delete_row' | 'verify' | 'sign'
    sectionTitle: varchar("section_title", { length: 255 }),
    itemLabel: varchar("item_label", { length: 255 }),
    previousValue: text("previous_value"),
    newValue: text("new_value"),
    operationalDate: date("operational_date").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_audit_record_date").on(table.dailyRecordId, table.createdAt),
    index("idx_audit_rest_date").on(table.restaurantId, table.operationalDate),
    index("idx_audit_rec_created").on(table.dailyRecordId, table.createdAt),
    index("idx_audit_rest_created").on(table.restaurantId, table.createdAt),
  ]
);

// RELATIONS
export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  users: many(users),
  subscriptions: many(subscriptions),
  categories: many(categories),
  items: many(items),
  wastageReasons: many(wastageReasons),
  wastageRecords: many(wastageRecords),
  salesRecords: many(salesRecords),
  checklistTemplates: many(checklistTemplates),
  dailyChecklistRecords: many(dailyChecklistRecords),
  checklistAuditLogs: many(checklistAuditLogs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [users.restaurantId],
    references: [restaurants.id],
  }),
  wastageRecords: many(wastageRecords),
  salesRecords: many(salesRecords),
  checklistAuditLogs: many(checklistAuditLogs),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [subscriptions.restaurantId],
    references: [restaurants.id],
  }),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [items.restaurantId],
    references: [restaurants.id],
  }),
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  wastageRecords: many(wastageRecords),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id],
  }),
  items: many(items),
  wastageRecords: many(wastageRecords),
}));

export const wastageReasonsRelations = relations(wastageReasons, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [wastageReasons.restaurantId],
    references: [restaurants.id],
  }),
  wastageRecords: many(wastageRecords),
}));

export const wastageRecordsRelations = relations(wastageRecords, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [wastageRecords.restaurantId],
    references: [restaurants.id],
  }),
  item: one(items, {
    fields: [wastageRecords.itemId],
    references: [items.id],
  }),
  category: one(categories, {
    fields: [wastageRecords.categoryId],
    references: [categories.id],
  }),
  reason: one(wastageReasons, {
    fields: [wastageRecords.reasonId],
    references: [wastageReasons.id],
  }),
  user: one(users, {
    fields: [wastageRecords.createdBy],
    references: [users.id],
  }),
}));

export const salesRecordsRelations = relations(salesRecords, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [salesRecords.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [salesRecords.createdBy],
    references: [users.id],
  }),
}));

export const checklistTemplatesRelations = relations(checklistTemplates, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [checklistTemplates.restaurantId],
    references: [restaurants.id],
  }),
  versions: many(checklistTemplateVersions),
  sections: many(checklistSections),
  dailyRecords: many(dailyChecklistRecords),
}));

export const checklistTemplateVersionsRelations = relations(checklistTemplateVersions, ({ one, many }) => ({
  template: one(checklistTemplates, {
    fields: [checklistTemplateVersions.templateId],
    references: [checklistTemplates.id],
  }),
  dailyRecords: many(dailyChecklistRecords),
}));

export const checklistSectionsRelations = relations(checklistSections, ({ one, many }) => ({
  template: one(checklistTemplates, {
    fields: [checklistSections.templateId],
    references: [checklistTemplates.id],
  }),
  items: many(checklistItems),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  section: one(checklistSections, {
    fields: [checklistItems.sectionId],
    references: [checklistSections.id],
  }),
}));

export const dailyChecklistRecordsRelations = relations(dailyChecklistRecords, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [dailyChecklistRecords.restaurantId],
    references: [restaurants.id],
  }),
  template: one(checklistTemplates, {
    fields: [dailyChecklistRecords.templateId],
    references: [checklistTemplates.id],
  }),
  version: one(checklistTemplateVersions, {
    fields: [dailyChecklistRecords.templateVersionId],
    references: [checklistTemplateVersions.id],
  }),
  values: many(dailyChecklistValues),
  repeatableRows: many(dailyRepeatableRows),
  auditLogs: many(checklistAuditLogs),
}));

export const dailyChecklistValuesRelations = relations(dailyChecklistValues, ({ one }) => ({
  dailyRecord: one(dailyChecklistRecords, {
    fields: [dailyChecklistValues.dailyRecordId],
    references: [dailyChecklistRecords.id],
  }),
  updatedByUser: one(users, {
    fields: [dailyChecklistValues.updatedBy],
    references: [users.id],
  }),
}));

export const dailyRepeatableRowsRelations = relations(dailyRepeatableRows, ({ one }) => ({
  dailyRecord: one(dailyChecklistRecords, {
    fields: [dailyRepeatableRows.dailyRecordId],
    references: [dailyChecklistRecords.id],
  }),
}));

export const checklistAuditLogsRelations = relations(checklistAuditLogs, ({ one }) => ({
  dailyRecord: one(dailyChecklistRecords, {
    fields: [checklistAuditLogs.dailyRecordId],
    references: [dailyChecklistRecords.id],
  }),
  restaurant: one(restaurants, {
    fields: [checklistAuditLogs.restaurantId],
    references: [restaurants.id],
  }),
  user: one(users, {
    fields: [checklistAuditLogs.userId],
    references: [users.id],
  }),
}));

