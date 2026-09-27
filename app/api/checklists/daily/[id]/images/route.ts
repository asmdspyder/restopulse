import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  dailyChecklistRecords,
  dailyChecklistValues,
  checklistAuditLogs,
} from "@/lib/db/schema";
import { uploadToR2, deleteFromR2 } from "@/lib/r2/client";
import { eq, and } from "drizzle-orm";

export interface ChecklistItemImage {
  id: string;
  slot: number;
  storageKey: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: dailyRecordId } = await params;

    const [dailyRecord] = await db
      .select()
      .from(dailyChecklistRecords)
      .where(
        and(
          eq(dailyChecklistRecords.id, dailyRecordId),
          eq(dailyChecklistRecords.restaurantId, auth.restaurant.id)
        )
      )
      .limit(1);

    if (!dailyRecord) {
      return NextResponse.json(
        { error: "Daily checklist record not found or access denied" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const itemKey = formData.get("itemKey") as string;
    const itemId = (formData.get("itemId") as string) || null;
    const sectionId = (formData.get("sectionId") as string) || null;
    const requestedSlotStr = formData.get("slot") as string | null;
    const itemLabel = (formData.get("itemLabel") as string) || itemKey;
    const sectionTitle = (formData.get("sectionTitle") as string) || "Checklist Item";
    const widthStr = formData.get("width") as string | null;
    const heightStr = formData.get("height") as string | null;

    if (!file || !itemKey) {
      return NextResponse.json(
        { error: "File and itemKey are required" },
        { status: 400 }
      );
    }

    // Existing values
    const [existingValue] = await db
      .select()
      .from(dailyChecklistValues)
      .where(
        and(
          eq(dailyChecklistValues.dailyRecordId, dailyRecordId),
          eq(dailyChecklistValues.itemKey, itemKey)
        )
      )
      .limit(1);

    let currentImages: ChecklistItemImage[] = [];
    if (existingValue?.valueJson && Array.isArray(existingValue.valueJson.images)) {
      currentImages = [...existingValue.valueJson.images];
    }

    // Determine slot
    let slot = requestedSlotStr ? parseInt(requestedSlotStr, 10) : 0;
    if (!slot || isNaN(slot) || slot < 1 || slot > 5) {
      // Find lowest unused slot between 1 and 5
      const usedSlots = new Set(currentImages.map((img) => img.slot));
      for (let s = 1; s <= 5; s++) {
        if (!usedSlots.has(s)) {
          slot = s;
          break;
        }
      }
      if (!slot) {
        return NextResponse.json(
          { error: "Maximum of 5 photos per checklist item reached" },
          { status: 400 }
        );
      }
    }

    // Clean item label for storage key
    const cleanItemName = itemLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || "item";

    const storageKey = `${auth.restaurant.id}/checklists/${dailyRecord.date}/${cleanItemName}_${slot}.webp`;

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudflare R2
    await uploadToR2(storageKey, buffer, file.type || "image/webp");

    const imageEntry: ChecklistItemImage = {
      id: String(slot),
      slot,
      storageKey,
      url: `/api/images/${storageKey}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: auth.user.name,
      width: widthStr ? parseInt(widthStr, 10) : undefined,
      height: heightStr ? parseInt(heightStr, 10) : undefined,
      sizeBytes: buffer.length,
    };

    // Replace or append
    const updatedImages = currentImages.filter((img) => img.slot !== slot);
    updatedImages.push(imageEntry);
    updatedImages.sort((a, b) => a.slot - b.slot);

    const newValueJson = {
      ...(existingValue?.valueJson || {}),
      images: updatedImages,
    };

    if (existingValue) {
      await db
        .update(dailyChecklistValues)
        .set({
          valueJson: newValueJson,
          updatedBy: auth.user.id,
          updatedByName: auth.user.name,
          updatedAt: new Date(),
        })
        .where(eq(dailyChecklistValues.id, existingValue.id));
    } else {
      await db.insert(dailyChecklistValues).values({
        dailyRecordId,
        itemId,
        sectionId,
        itemKey,
        valueJson: newValueJson,
        updatedBy: auth.user.id,
        updatedByName: auth.user.name,
      });
    }

    // Audit log
    await db.insert(checklistAuditLogs).values({
      dailyRecordId,
      restaurantId: auth.restaurant.id,
      userId: auth.user.id,
      userName: auth.user.name,
      action: "upload_image",
      sectionTitle,
      itemLabel,
      newValue: `Uploaded photo ${slot} (${(buffer.length / 1024).toFixed(1)} KB)`,
      operationalDate: dailyRecord.date,
    });

    return NextResponse.json({
      success: true,
      image: imageEntry,
      allImages: updatedImages,
    });
  } catch (error: any) {
    console.error("POST /api/checklists/daily/[id]/images error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: dailyRecordId } = await params;
    const body = await req.json();
    const { itemKey, slot, storageKey } = body;

    if (!itemKey || !slot) {
      return NextResponse.json(
        { error: "itemKey and slot are required" },
        { status: 400 }
      );
    }

    const [existingValue] = await db
      .select()
      .from(dailyChecklistValues)
      .where(
        and(
          eq(dailyChecklistValues.dailyRecordId, dailyRecordId),
          eq(dailyChecklistValues.itemKey, itemKey)
        )
      )
      .limit(1);

    if (!existingValue || !existingValue.valueJson?.images) {
      return NextResponse.json({ success: true, allImages: [] });
    }

    const currentImages: ChecklistItemImage[] = existingValue.valueJson.images || [];
    const targetImage = currentImages.find(
      (img) => img.slot === slot || (storageKey && img.storageKey === storageKey)
    );

    if (targetImage?.storageKey) {
      try {
        await deleteFromR2(targetImage.storageKey);
      } catch (err) {
        console.warn("Failed to delete from R2:", err);
      }
    }

    const updatedImages = currentImages.filter(
      (img) => img.slot !== slot && (!storageKey || img.storageKey !== storageKey)
    );

    const newValueJson = {
      ...existingValue.valueJson,
      images: updatedImages,
    };

    await db
      .update(dailyChecklistValues)
      .set({
        valueJson: newValueJson,
        updatedBy: auth.user.id,
        updatedByName: auth.user.name,
        updatedAt: new Date(),
      })
      .where(eq(dailyChecklistValues.id, existingValue.id));

    return NextResponse.json({
      success: true,
      allImages: updatedImages,
    });
  } catch (error: any) {
    console.error("DELETE /api/checklists/daily/[id]/images error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete image" },
      { status: 500 }
    );
  }
}
