import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { checklistAuditLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const logs = await db
      .select()
      .from(checklistAuditLogs)
      .where(eq(checklistAuditLogs.dailyRecordId, id))
      .orderBy(desc(checklistAuditLogs.createdAt))
      .limit(100);

    return NextResponse.json({ auditLogs: logs });
  } catch (error: any) {
    console.error("GET /api/checklists/daily/[id]/audit error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch audit logs" }, { status: 500 });
  }
}
