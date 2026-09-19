import { formatCurrency, formatPercentage } from "@/lib/utils";

export interface WastageInsight {
  id: string;
  type: "critical" | "warning" | "positive" | "info";
  title: string;
  description: string;
  recommendation?: string;
  metric?: string;
}

export interface InsightInputData {
  currentPeriodTotalWastage: number;
  previousPeriodTotalWastage: number;
  topReasons: Array<{ name: string; value: number; percentage: number }>;
  topItems: Array<{ name: string; value: number; percentage: number }>;
  topAreas?: Array<{ name: string; value: number; percentage: number }>;
  recordCount: number;
  periodLabel: string; // "this month", "this week", "today", etc.
}

export function generateRuleBasedInsights(data: InsightInputData): WastageInsight[] {
  const insights: WastageInsight[] = [];
  const {
    currentPeriodTotalWastage,
    previousPeriodTotalWastage,
    topReasons,
    topItems,
    recordCount,
    periodLabel,
  } = data;

  // Rule 0: Insufficient data guard
  if (recordCount === 0 || currentPeriodTotalWastage === 0) {
    return [
      {
        id: "empty_state",
        type: "info",
        title: "No wastage recorded for this period",
        description: `Start logging wastage events to unlock actionable trend insights and cost drivers.`,
        recommendation: "Record daily wastage using the fast logger.",
      },
    ];
  }

  if (recordCount < 3) {
    insights.push({
      id: "early_data",
      type: "info",
      title: "Keep recording to unlock deeper insights",
      description: `You have ${recordCount} record(s) ${periodLabel}. More data will unlock comparative spike detection.`,
    });
  }

  // Rule 3: Top Wastage Reason Concentration
  if (topReasons.length > 0) {
    const topReason = topReasons[0];
    if (topReason.percentage >= 30) {
      insights.push({
        id: "top_reason_dominant",
        type: "critical",
        title: `${topReason.name} is your biggest source of wastage`,
        description: `${topReason.name} accounts for ${formatPercentage(topReason.percentage)} (${formatCurrency(topReason.value)}) of all waste ${periodLabel}.`,
        recommendation: getReasonRecommendation(topReason.name),
        metric: `${formatPercentage(topReason.percentage)} of total`,
      });
    } else if (topReason.percentage > 15) {
      insights.push({
        id: "top_reason_major",
        type: "warning",
        title: `Leading cause: ${topReason.name}`,
        description: `Responsible for ${formatPercentage(topReason.percentage)} of total loss (${formatCurrency(topReason.value)}) ${periodLabel}.`,
        recommendation: getReasonRecommendation(topReason.name),
      });
    }
  }

  // Rule 4: Top Cost Driver Item Concentration
  if (topItems.length > 0) {
    const topItem = topItems[0];
    if (topItem.percentage >= 25) {
      insights.push({
        id: "top_item_concentration",
        type: "warning",
        title: `${topItem.name} represents ${formatPercentage(topItem.percentage)} of total cost`,
        description: `${topItem.name} alone generated ${formatCurrency(topItem.value)} in loss ${periodLabel}.`,
        recommendation: `Check batch sizes, holding temperatures, and yield logs for ${topItem.name}.`,
        metric: formatCurrency(topItem.value),
      });
    }
  }

  // Rule 5: Period-over-period Trend Comparison
  if (previousPeriodTotalWastage > 0 && recordCount >= 3) {
    const pctChange =
      ((currentPeriodTotalWastage - previousPeriodTotalWastage) /
        previousPeriodTotalWastage) *
      100;

    if (pctChange >= 15) {
      insights.push({
        id: "trend_increase",
        type: "critical",
        title: `Wastage increased by ${pctChange.toFixed(1)}%`,
        description: `Total wastage climbed from ${formatCurrency(previousPeriodTotalWastage)} to ${formatCurrency(currentPeriodTotalWastage)} compared to the previous period.`,
        recommendation: "Check if high-volume items or staff turnover contributed to this increase.",
        metric: `+${pctChange.toFixed(1)}%`,
      });
    } else if (pctChange <= -10) {
      insights.push({
        id: "trend_decrease",
        type: "positive",
        title: `Wastage reduced by ${Math.abs(pctChange).toFixed(1)}%`,
        description: `Great progress! Wastage dropped from ${formatCurrency(previousPeriodTotalWastage)} to ${formatCurrency(currentPeriodTotalWastage)} compared to the previous period.`,
        metric: `-${Math.abs(pctChange).toFixed(1)}%`,
      });
    }
  }

  return insights.slice(0, 4); // Show top 4 most impactful actionable insights
}

function getReasonRecommendation(reason: string): string {
  const r = reason.toLowerCase();
  if (r.includes("over-prep") || r.includes("over prep")) {
    return "Refine daily prep par-levels based on historical sales forecast.";
  }
  if (r.includes("spoil") || r.includes("expired")) {
    return "Enforce FIFO (First In First Out) rotation and review cold storage temperature logs.";
  }
  if (r.includes("burnt") || r.includes("cook")) {
    return "Standardize timer usage and review station line cooking SOPs.";
  }
  if (r.includes("wrong order") || r.includes("remake")) {
    return "Improve order communication between front-of-house POS and kitchen display.";
  }
  if (r.includes("portion")) {
    return "Implement calibrated portion scoops and kitchen scales at plating stations.";
  }
  return "Investigate station practices and train kitchen team on reduction techniques.";
}
