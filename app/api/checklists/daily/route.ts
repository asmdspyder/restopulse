import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { getOrCreateDailyChecklist, updateDailyItemValue } from "@/lib/services/checklists";
import { formatLocalDateToYMD } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json({ error: "Access blocked", blockReason: auth.blockReason }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get("templateId") || searchParams.get("code") || null;
    const dateStr = searchParams.get("date") || formatLocalDateToYMD();

    const data = await getOrCreateDailyChecklist(auth.restaurant.id, templateId, dateStr, auth.user);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/checklists/daily error:", error);
    return NextResponse.json({ error: error.message || "Failed to load daily checklist" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json({ error: "Access blocked", blockReason: auth.blockReason }, { status: 403 });
    }

    const body = await req.json();
    const { dailyRecordId, itemKey, payload } = body;

    if (!dailyRecordId || !itemKey) {
      return NextResponse.json({ error: "dailyRecordId and itemKey are required" }, { status: 400 });
    }

    const result = await updateDailyItemValue(dailyRecordId, itemKey, payload, auth.user);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/checklists/daily error:", error);
    return NextResponse.json({ error: error.message || "Failed to update item" }, { status: 500 });
  }
}
