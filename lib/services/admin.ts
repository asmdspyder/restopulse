import { db } from "@/lib/db";
import { restaurants, users, subscriptions, wastageRecords, demoRequests } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { seedRestaurantDefaults } from "@/lib/services/onboarding";
import { eq, desc, sql, ilike, or, and } from "drizzle-orm";

export async function getAdminOverviewMetrics() {
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where account_status = 'active')::int`,
      deactivated: sql<number>`count(*) filter (where account_status = 'manually_deactivated')::int`,
    })
    .from(restaurants);

  const [subs] = await db
    .select({
      monthlyCount: sql<number>`count(*) filter (where plan_type = 'monthly' and status = 'active')::int`,
      yearlyCount: sql<number>`count(*) filter (where plan_type = 'yearly' and status = 'active')::int`,
      monthlyRevenue: sql<string>`COALESCE(SUM(amount) filter (where plan_type = 'monthly' and status = 'active'), 0)`,
      yearlyRevenue: sql<string>`COALESCE(SUM(amount) filter (where plan_type = 'yearly' and status = 'active'), 0)`,
    })
    .from(subscriptions);

  const monthlyRev = parseFloat(subs?.monthlyRevenue || "0");
  const yearlyRev = parseFloat(subs?.yearlyRevenue || "0");
  const approxMRR = monthlyRev + yearlyRev / 12;
  const approxARR = approxMRR * 12;

  return {
    totalRestaurants: counts?.total || 0,
    activeAccounts: counts?.active || 0,
    deactivatedAccounts: counts?.deactivated || 0,
    monthlySubscriptions: subs?.monthlyCount || 0,
    yearlySubscriptions: subs?.yearlyCount || 0,
    approxMRR: parseFloat(approxMRR.toFixed(2)),
    approxARR: parseFloat(approxARR.toFixed(2)),
  };
}

export async function getAdminAccounts(search?: string, statusFilter?: string) {
  // Query all restaurants
  const allRestaurants = await db
    .select({
      id: restaurants.id,
      businessName: restaurants.businessName,
      contactName: restaurants.contactName,
      email: restaurants.email,
      phone: restaurants.phone,
      accountStatus: restaurants.accountStatus,
      createdAt: restaurants.createdAt,
    })
    .from(restaurants)
    .orderBy(desc(restaurants.createdAt));

  // Query all subscriptions ordered by created_at DESC
  const allSubscriptions = await db
    .select({
      restaurantId: subscriptions.restaurantId,
      planType: subscriptions.planType,
      status: subscriptions.status,
      amount: subscriptions.amount,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .orderBy(desc(subscriptions.createdAt));

  // Map each restaurant to its single latest/active subscription
  const latestSubMap = new Map<string, (typeof allSubscriptions)[0]>();
  for (const sub of allSubscriptions) {
    if (!latestSubMap.has(sub.restaurantId)) {
      latestSubMap.set(sub.restaurantId, sub);
    } else {
      const current = latestSubMap.get(sub.restaurantId)!;
      // Prefer active subscription over trial
      if (current.status !== "active" && sub.status === "active") {
        latestSubMap.set(sub.restaurantId, sub);
      }
    }
  }

  const rows = allRestaurants.map((r) => {
    const sub = latestSubMap.get(r.id);
    return {
      id: r.id,
      businessName: r.businessName,
      contactName: r.contactName,
      email: r.email,
      phone: r.phone,
      accountStatus: r.accountStatus,
      createdAt: r.createdAt,
      subPlan: sub?.planType || null,
      subStatus: sub?.status || null,
      subAmount: sub?.amount ? parseFloat(sub.amount) : null,
      subExpiry: sub?.currentPeriodEnd || null,
    };
  });

  let filtered = rows;

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.businessName.toLowerCase().includes(q) ||
        r.contactName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
    );
  }

  if (statusFilter && statusFilter !== "all") {
    filtered = filtered.filter((r) => r.accountStatus === statusFilter);
  }

  return filtered;
}

export async function getAdminAccountDetails(restaurantId: string) {
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);

  if (!restaurant) return null;

  const restaurantUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.restaurantId, restaurantId));

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.restaurantId, restaurantId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const [stats] = await db
    .select({
      totalWastageRecords: sql<number>`count(*)::int`,
      totalWastageValue: sql<string>`COALESCE(SUM(wastage_value), 0)`,
    })
    .from(wastageRecords)
    .where(eq(wastageRecords.restaurantId, restaurantId));

  return {
    restaurant,
    users: restaurantUsers,
    subscription: sub || null,
    stats: {
      totalWastageRecords: stats?.totalWastageRecords || 0,
      totalWastageValue: parseFloat(stats?.totalWastageValue || "0"),
    },
  };
}

export async function setAccountStatus(
  restaurantId: string,
  status: "active" | "manually_deactivated"
) {
  const [updated] = await db
    .update(restaurants)
    .set({
      accountStatus: status,
      updatedAt: new Date(),
    })
    .where(eq(restaurants.id, restaurantId))
    .returning();

  return updated;
}

export interface CreateManagedAccountInput {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address?: string;
  password: string;
  planType?: string; // 'manual_managed' | 'yearly' | 'monthly'
  expiryDate?: string; // YYYY-MM-DD (optional, defaults to 5 years if lifetime/manual)
}

export async function createAdminManagedAccount(input: CreateManagedAccountInput) {
  const {
    businessName,
    contactName,
    email,
    phone,
    address,
    password,
    planType = "manual_managed",
    expiryDate,
  } = input;

  const cleanEmail = email.trim().toLowerCase();

  // Check if user/restaurant email already exists
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await hashPassword(password);

  // 1. Create Restaurant Workspace
  const [restaurant] = await db
    .insert(restaurants)
    .values({
      businessName: businessName.trim(),
      contactName: contactName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      address: address ? address.trim() : null,
      currency: "INR",
      timezone: "Asia/Kolkata",
      accountStatus: "active",
      onboardingCompleted: true,
    })
    .returning();

  // 2. Create Owner User
  const [user] = await db
    .insert(users)
    .values({
      restaurantId: restaurant.id,
      name: contactName.trim(),
      email: cleanEmail,
      passwordHash,
      role: "admin",
      status: "active",
    })
    .returning();

  // 3. Seed Default Categories, Units, Reasons
  await seedRestaurantDefaults(restaurant.id);

  // 4. Calculate Expiry Date
  const now = new Date();
  let periodEnd: Date;
  if (expiryDate) {
    periodEnd = new Date(expiryDate + "T23:59:59.999");
  } else {
    // 5 years default for manual managed accounts
    periodEnd = new Date(now);
    periodEnd.setFullYear(periodEnd.getFullYear() + 5);
  }

  const [sub] = await db
    .insert(subscriptions)
    .values({
      restaurantId: restaurant.id,
      planType,
      billingInterval: "manual",
      amount: "0.00",
      currency: "INR",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextBillingAt: periodEnd,
    })
    .returning();

  return {
    restaurant,
    user,
    subscription: sub,
  };
}

export async function updateAccountExpiry(restaurantId: string, expiryDate: string) {
  const newEnd = new Date(expiryDate + "T23:59:59.999");

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.restaurantId, restaurantId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (sub) {
    const [updated] = await db
      .update(subscriptions)
      .set({
        currentPeriodEnd: newEnd,
        nextBillingAt: newEnd,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id))
      .returning();

    return updated;
  } else {
    const [created] = await db
      .insert(subscriptions)
      .values({
        restaurantId,
        planType: "manual_managed",
        billingInterval: "manual",
        amount: "0.00",
        currency: "INR",
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: newEnd,
        nextBillingAt: newEnd,
      })
      .returning();

    return created;
  }
}

export async function resetAccountUserPassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword);
  const [updated] = await db
    .update(users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ id: users.id, email: users.email });

  return updated;
}

// -------------------------------------------------------------
// DEMO REQUESTS MANAGEMENT
// -------------------------------------------------------------
export async function createDemoRequest(data: {
  name: string;
  email: string;
  phone: string;
  restaurantName: string;
  address: string;
  demoDate: string;
  demoSlot: string;
  referralSource?: string;
  notes?: string;
}) {
  const [created] = await db
    .insert(demoRequests)
    .values({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      restaurantName: data.restaurantName.trim(),
      address: data.address.trim(),
      demoDate: data.demoDate.trim(),
      demoSlot: data.demoSlot.trim(),
      referralSource: data.referralSource?.trim() || null,
      notes: data.notes?.trim() || null,
      status: "pending",
    })
    .returning();

  return created;
}

export async function getDemoRequests(search?: string, statusFilter?: string) {
  let query = db.select().from(demoRequests);
  const conditions = [];

  if (statusFilter && statusFilter !== "all") {
    conditions.push(eq(demoRequests.status, statusFilter));
  }

  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    conditions.push(
      or(
        ilike(demoRequests.name, s),
        ilike(demoRequests.email, s),
        ilike(demoRequests.phone, s),
        ilike(demoRequests.restaurantName, s),
        ilike(demoRequests.address, s),
        ilike(demoRequests.referralSource, s)
      )
    );
  }

  if (conditions.length === 1) {
    query = query.where(conditions[0]) as any;
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions)) as any;
  }

  const results = await query.orderBy(desc(demoRequests.createdAt));
  return results;
}

export async function updateDemoRequestStatus(id: string, status: string, notes?: string) {
  const [updated] = await db
    .update(demoRequests)
    .set({
      status,
      ...(notes !== undefined ? { notes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(demoRequests.id, id))
    .returning();

  return updated;
}

export async function deleteDemoRequest(id: string) {
  const [deleted] = await db
    .delete(demoRequests)
    .where(eq(demoRequests.id, id))
    .returning();

  return deleted;
}

export async function getDemoMetrics() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where status = 'pending')::int`,
      completed: sql<number>`count(*) filter (where status = 'completed')::int`,
      today: sql<number>`count(*) filter (where demo_date = ${todayStr})::int`,
    })
    .from(demoRequests);

  return {
    total: counts?.total || 0,
    pending: counts?.pending || 0,
    completed: counts?.completed || 0,
    today: counts?.today || 0,
  };
}

