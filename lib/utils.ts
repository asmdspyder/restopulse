import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "₹0";
  }
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0.00%";
  }
  return `${value.toFixed(2)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function calculatePercentageChange(current: number, previous: number): {
  percent: number;
  direction: "up" | "down" | "flat";
  formatted: string;
} {
  if (previous === 0) {
    if (current === 0) {
      return { percent: 0, direction: "flat", formatted: "0%" };
    }
    return { percent: 100, direction: "up", formatted: "+100%" };
  }

  const change = ((current - previous) / previous) * 100;
  const absChange = Math.abs(change);
  const formatted = `${change > 0 ? "+" : change < 0 ? "-" : ""}${absChange.toFixed(1)}%`;

  if (Math.abs(change) < 0.1) {
    return { percent: 0, direction: "flat", formatted: "0%" };
  }

  return {
    percent: change,
    direction: change > 0 ? "up" : "down",
    formatted,
  };
}

export function formatLocalDateToYMD(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getYesterdayLocalDateYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatLocalDateToYMD(d);
}
