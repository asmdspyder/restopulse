import { db } from "@/lib/db";
import { wastageRecords } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import { generateRuleBasedInsights, WastageInsight } from "@/lib/insights/engine";
import { formatLocalDateToYMD } from "@/lib/utils";

export type PeriodType = "today" | "week" | "month" | "year" | "custom";

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
  label: string;
  daysCount: number;
}

export function getDateRanges(
  period: PeriodType,
  customStart?: string,
  customEnd?: string
): AnalyticsPeriod {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let prevStartDate: Date;
  let prevEndDate: Date;
  let label = "this month";

  if (period === "today") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    prevStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    label = "today";
  } else if (period === "week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
    const duration = endDate.getTime() - startDate.getTime();
    prevEndDate = new Date(startDate.getTime() - 1);
    prevStartDate = new Date(prevEndDate.getTime() - duration);
    label = "this week";
  } else if (period === "year") {
    startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    prevStartDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
    prevEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    label = "this year";
  } else if (period === "custom" && customStart && customEnd) {
    startDate = new Date(customStart + "T00:00:00");
    endDate = new Date(customEnd + "T23:59:59.999");
    const duration = endDate.getTime() - startDate.getTime();
    prevEndDate = new Date(startDate.getTime() - 1);
    prevStartDate = new Date(prevEndDate.getTime() - duration);
    label = "selected period";
  } else {
    // Default: 'month'
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    label = "this month";
  }

  const daysCount = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  return { startDate, endDate, prevStartDate, prevEndDate, label, daysCount };
}

export interface DashboardMetrics {
  totalWastage: number;
  prevTotalWastage: number;
  wastagePercentChange: { percent: number; direction: "up" | "down" | "flat"; formatted: string };
  recordCount: number;
  averageWastagePerDay: number;
  topWasteReason: { name: string; percentage: number; value: number } | null;
  topWasteItem: { name: string; percentage: number; value: number } | null;
  topReasons: Array<{ name: string; value: number; percentage: number; count: number }>;
  topItems: Array<{ name: string; value: number; percentage: number; quantity: number; unit: string }>;
  topCategories: Array<{ name: string; value: number; percentage: number }>;
  topAreas: Array<{ name: string; value: number; percentage: number }>;
  trend: Array<{ date: string; wastageValue: number; recordsCount: number }>;
  insights: WastageInsight[];
  periodLabel: string;
}

export async function getDashboardAnalytics(
  restaurantId: string,
  period: PeriodType = "month",
  customStart?: string,
  customEnd?: string
): Promise<DashboardMetrics> {
  const { startDate, endDate, prevStartDate, prevEndDate, label, daysCount } = getDateRanges(
    period,
    customStart,
    customEnd
  );

  // 1. Current Period Total Wastage and Count
  const [currentSummary] = await db
    .select({
      totalValue: sql<string>`COALESCE(SUM(wastage_value), 0)`,
      count: sql<number>`count(*)::int`,
    })
    .from(wastageRecords)
    .where(
      and(
        eq(wastageRecords.restaurantId, restaurantId),
        gte(wastageRecords.recordedAt, startDate),
        lte(wastageRecords.recordedAt, endDate)
      )
    );

  const totalWastage = parseFloat(currentSummary?.totalValue || "0");
  const recordCount = currentSummary?.count || 0;
  const averageWastagePerDay = totalWastage / daysCount;

  // 2. Previous Period Total Wastage
  const [prevSummary] = await db
    .select({
      totalValue: sql<string>`COALESCE(SUM(wastage_value), 0)`,
    })
    .from(wastageRecords)
    .where(
      and(
        eq(wastageRecords.restaurantId, restaurantId),
        gte(wastageRecords.recordedAt, prevStartDate),
        lte(wastageRecords.recordedAt, prevEndDate)
      )
    );

  const prevTotalWastage = parseFloat(prevSummary?.totalValue || "0");

  let changePercent = 0;
  let direction: "up" | "down" | "flat" = "flat";
  if (prevTotalWastage > 0) {
    changePercent = ((totalWastage - prevTotalWastage) / prevTotalWastage) * 100;
    direction = changePercent > 0.1 ? "up" : changePercent < -0.1 ? "down" : "flat";
  } else if (totalWastage > 0) {
    changePercent = 100;
    direction = "up";
  }

  const wastagePercentChange = {
    percent: Math.abs(changePercent),
    direction,
    formatted: `${changePercent > 0 ? "+" : changePercent < 0 ? "-" : ""}${Math.abs(
      changePercent
    ).toFixed(1)}%`,
  };

  // 3. Breakdown by Reason
  const reasonRows = await db
    .select({
      name: wastageRecords.reasonNameSnapshot,
      value: sql<string>`SUM(wastage_value)`,
      count: sql<number>`count(*)::int`,
    })
    .from(wastageRecords)
    .where(
      and(
        eq(wastageRecords.restaurantId, restaurantId),
        gte(wastageRecords.recordedAt, startDate),
        lte(wastageRecords.recordedAt, endDate)
      )
    )
    .groupBy(wastageRecords.reasonNameSnapshot)
    .orderBy(desc(sql`SUM(wastage_value)`))
    .limit(10);

  const topReasons = reasonRows.map((r) => {
    const val = parseFloat(r.value || "0");
    return {
      name: r.name,
      value: val,
      percentage: totalWastage > 0 ? parseFloat(((val / totalWastage) * 100).toFixed(1)) : 0,
      count: r.count,
    };
  });

  // 4. Breakdown by Top Items
  const itemRows = await db
    .select({
      name: wastageRecords.itemNameSnapshot,
      unit: wastageRecords.unit,
      value: sql<string>`SUM(wastage_value)`,
      totalQty: sql<string>`SUM(quantity)`,
    })
    .from(wastageRecords)
    .where(
      and(
        eq(wastageRecords.restaurantId, restaurantId),
        gte(wastageRecords.recordedAt, startDate),
        lte(wastageRecords.recordedAt, endDate)
      )
    )
    .groupBy(wastageRecords.itemNameSnapshot, wastageRecords.unit)
    .orderBy(desc(sql`SUM(wastage_value)`))
    .limit(10);

  const topItems = itemRows.map((i) => {
    const val = parseFloat(i.value || "0");
    return {
      name: i.name,
      unit: i.unit,
      value: val,
      quantity: parseFloat(i.totalQty || "0"),
      percentage: totalWastage > 0 ? parseFloat(((val / totalWastage) * 100).toFixed(1)) : 0,
    };
  });

  // 5. Breakdown by Category
  const catRows = await db
    .select({
      name: wastageRecords.categoryNameSnapshot,
      value: sql<string>`SUM(wastage_value)`,
    })
    .from(wastageRecords)
    .where(
      and(
        eq(wastageRecords.restaurantId, restaurantId),
        gte(wastageRecords.recordedAt, startDate),
        lte(wastageRecords.recordedAt, endDate)
      )
    )
    .groupBy(wastageRecords.categoryNameSnapshot)
    .orderBy(desc(sql`SUM(wastage_value)`))
    .limit(6);

  const topCategories = catRows.map((c) => {
    const val = parseFloat(c.value || "0");
    return {
      name: c.name || "General",
      value: val,
      percentage: totalWastage > 0 ? parseFloat(((val / totalWastage) * 100).toFixed(1)) : 0,
    };
  });

  // 6. Breakdown by Responsible Area
  const areaRows = await db
    .select({
      name: wastageRecords.responsibleArea,
      value: sql<string>`SUM(wastage_value)`,
    })
    .from(wastageRecords)
    .where(
      and(
        eq(wastageRecords.restaurantId, restaurantId),
        gte(wastageRecords.recordedAt, startDate),
        lte(wastageRecords.recordedAt, endDate)
      )
    )
    .groupBy(wastageRecords.responsibleArea)
    .orderBy(desc(sql`SUM(wastage_value)`));

  const topAreas = areaRows.map((a) => {
    const val = parseFloat(a.value || "0");
    return {
      name: a.name || "General",
      value: val,
      percentage: totalWastage > 0 ? parseFloat(((val / totalWastage) * 100).toFixed(1)) : 0,
    };
  });

  // 7. Trend time series (Daily grouping)
  const dailyWastage = await db
    .select({
      day: sql<string>`to_char(recorded_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')`,
      val: sql<string>`SUM(wastage_value)`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(wastageRecords)
    .where(
      and(
        eq(wastageRecords.restaurantId, restaurantId),
        gte(wastageRecords.recordedAt, startDate),
        lte(wastageRecords.recordedAt, endDate)
      )
    )
    .groupBy(sql`to_char(recorded_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(recorded_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')`);

  const trendMap = new Map<
    string,
    {
      date: string;
      wastageValue: number;
      recordsCount: number;
    }
  >();

  // If period is today, week, or month, fill empty days so charts look complete and smooth
  if (daysCount <= 31) {
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const dStr = formatLocalDateToYMD(curr);
      trendMap.set(dStr, {
        date: dStr,
        wastageValue: 0,
        recordsCount: 0,
      });
      curr.setDate(curr.getDate() + 1);
    }
  }

  dailyWastage.forEach((dw) => {
    const existing = trendMap.get(dw.day) || {
      date: dw.day,
      wastageValue: 0,
      recordsCount: 0,
    };
    existing.wastageValue = parseFloat(dw.val || "0");
    existing.recordsCount = dw.cnt;
    trendMap.set(dw.day, existing);
  });

  const trend = Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const topWasteReason = topReasons.length > 0 ? topReasons[0] : null;
  const topWasteItem = topItems.length > 0 ? topItems[0] : null;

  // 8. Generate Actionable Insights
  const insights = generateRuleBasedInsights({
    currentPeriodTotalWastage: totalWastage,
    previousPeriodTotalWastage: prevTotalWastage,
    topReasons,
    topItems,
    topAreas,
    recordCount,
    periodLabel: label,
  });

  return {
    totalWastage,
    prevTotalWastage,
    wastagePercentChange,
    recordCount,
    averageWastagePerDay,
    topWasteReason,
    topWasteItem,
    topReasons,
    topItems,
    topCategories,
    topAreas,
    trend,
    insights,
    periodLabel: label,
  };
}
