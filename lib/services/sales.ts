import { db } from "@/lib/db";
import { salesRecords, users, restaurants } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { formatLocalDateToYMD, getYesterdayLocalDateYMD } from "@/lib/utils";

export interface UpsertSalesInput {
  restaurantId: string;
  date: string; // YYYY-MM-DD
  salesAmount: number;
  isClosed?: boolean;
  notes?: string;
  createdBy?: string;
}

export async function upsertDailySales(input: UpsertSalesInput) {
  const { restaurantId, date, salesAmount, isClosed = false, notes, createdBy } = input;

  const [record] = await db
    .insert(salesRecords)
    .values({
      restaurantId,
      date,
      salesAmount: salesAmount.toFixed(2),
      isClosed,
      notes: notes || null,
      createdBy: createdBy || null,
    })
    .onConflictDoUpdate({
      target: [salesRecords.restaurantId, salesRecords.date],
      set: {
        salesAmount: salesAmount.toFixed(2),
        isClosed,
        notes: notes || null,
        updatedAt: new Date(),
      },
    })
    .returning();

  return record;
}

export async function getSalesHistory(
  restaurantId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 30
) {
  const conditions = [eq(salesRecords.restaurantId, restaurantId)];

  if (startDate) {
    conditions.push(gte(salesRecords.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(salesRecords.date, endDate));
  }

  return db
    .select({
      id: salesRecords.id,
      date: salesRecords.date,
      salesAmount: salesRecords.salesAmount,
      isClosed: salesRecords.isClosed,
      notes: salesRecords.notes,
      createdAt: salesRecords.createdAt,
      updatedAt: salesRecords.updatedAt,
      createdByName: users.name,
    })
    .from(salesRecords)
    .leftJoin(users, eq(salesRecords.createdBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(salesRecords.date))
    .limit(limit);
}

export async function getTotalSalesForPeriod(
  restaurantId: string,
  startDate: string,
  endDate: string
): Promise<{ total: number; salesDaysCount: number }> {
  const [result] = await db
    .select({
      total: sql<string>`COALESCE(SUM(sales_amount), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(salesRecords)
    .where(
      and(
        eq(salesRecords.restaurantId, restaurantId),
        gte(salesRecords.date, startDate),
        lte(salesRecords.date, endDate)
      )
    );

  return {
    total: parseFloat(result?.total || "0"),
    salesDaysCount: result?.count || 0,
  };
}

export async function checkYesterdaySales(restaurantId: string) {
  const yesterdayIso = getYesterdayLocalDateYMD();
  const todayIso = formatLocalDateToYMD();

  // Check restaurant created date (do not prompt if restaurant was created today)
  const [restaurant] = await db
    .select({ createdAt: restaurants.createdAt })
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId))
    .limit(1);

  if (!restaurant) {
    return { missingYesterday: false };
  }

  const createdDateIso = formatLocalDateToYMD(new Date(restaurant.createdAt));
  if (createdDateIso >= todayIso) {
    // Brand new account created today -> no yesterday prompt
    return { missingYesterday: false };
  }

  // Check if yesterday's sales record exists
  const [record] = await db
    .select()
    .from(salesRecords)
    .where(
      and(
        eq(salesRecords.restaurantId, restaurantId),
        eq(salesRecords.date, yesterdayIso)
      )
    )
    .limit(1);

  if (!record) {
    return {
      missingYesterday: true,
      yesterdayDate: yesterdayIso,
    };
  }

  return { missingYesterday: false };
}
