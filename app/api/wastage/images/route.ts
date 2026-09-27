import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { uploadToR2 } from "@/lib/r2/client";
import { formatLocalDateToYMD } from "@/lib/utils";
import { updateWastageImage } from "@/lib/services/wastage";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json(
        { error: "Access blocked", blockReason: auth.blockReason },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const itemName = (formData.get("itemName") as string) || "item";
    const recordId = (formData.get("recordId") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "Photo file is required" }, { status: 400 });
    }

    const todayStr = formatLocalDateToYMD();
    const cleanItemName = itemName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 35) || "item";

    const timestamp = Date.now();
    const storageKey = `${auth.restaurant.id}/wastage/${todayStr}/${cleanItemName}_${timestamp}.webp`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudflare R2
    await uploadToR2(storageKey, buffer, file.type || "image/webp");

    const url = `/api/images/${storageKey}`;

    // If a recordId was provided, update the wastage record in the database directly
    let updatedRecord = null;
    if (recordId) {
      updatedRecord = await updateWastageImage(auth.restaurant.id, recordId, url);
    }

    return NextResponse.json({
      success: true,
      url,
      storageKey,
      sizeBytes: buffer.length,
      record: updatedRecord,
    });
  } catch (error: any) {
    console.error("POST /api/wastage/images error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload photo" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth || !auth.restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!auth.canAccessApp) {
      return NextResponse.json(
        { error: "Access blocked", blockReason: auth.blockReason },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const recordId = searchParams.get("recordId");

    if (!recordId) {
      return NextResponse.json({ error: "recordId is required" }, { status: 400 });
    }

    const updated = await updateWastageImage(auth.restaurant.id, recordId, null);
    return NextResponse.json({ success: true, record: updated });
  } catch (error: any) {
    console.error("DELETE /api/wastage/images error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove photo" },
      { status: 500 }
    );
  }
}
