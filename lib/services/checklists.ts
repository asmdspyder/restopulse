import { db } from "@/lib/db";
import {
  checklistTemplates,
  checklistTemplateVersions,
  checklistSections,
  checklistItems,
  dailyChecklistRecords,
  dailyChecklistValues,
  dailyRepeatableRows,
  checklistAuditLogs,
} from "@/lib/db/schema";
import { seedOpeningChecklist } from "./checklist-seed";
import { eq, and, desc, asc, sql } from "drizzle-orm";

export interface ChecklistUserContext {
  id: string;
  name: string;
  email: string;
  role: string;
  canManageChecklists?: boolean;
}

// 1. GET ALL TEMPLATES FOR RESTAURANT (AUTO-SEEDS IF EMPTY)
export async function getChecklistTemplates(restaurantId: string) {
  let rows = await db
    .select()
    .from(checklistTemplates)
    .where(and(eq(checklistTemplates.restaurantId, restaurantId), eq(checklistTemplates.isActive, true)))
    .orderBy(asc(checklistTemplates.createdAt));

  if (rows.length === 0) {
    await seedOpeningChecklist(restaurantId);
    rows = await db
      .select()
      .from(checklistTemplates)
      .where(and(eq(checklistTemplates.restaurantId, restaurantId), eq(checklistTemplates.isActive, true)))
      .orderBy(asc(checklistTemplates.createdAt));
  }

  return rows;
}

// 2. GET FULL TEMPLATE WITH SECTIONS AND ITEMS
export async function getChecklistTemplateWithStructure(templateId: string, restaurantId: string) {
  const [template] = await db
    .select()
    .from(checklistTemplates)
    .where(and(eq(checklistTemplates.id, templateId), eq(checklistTemplates.restaurantId, restaurantId)))
    .limit(1);

  if (!template) return null;

  const sections = await db
    .select()
    .from(checklistSections)
    .where(eq(checklistSections.templateId, templateId))
    .orderBy(asc(checklistSections.displayOrder));

  const sectionIds = sections.map((s) => s.id);

  let items: any[] = [];
  if (sectionIds.length > 0) {
    items = await db
      .select()
      .from(checklistItems)
      .where(sql`${checklistItems.sectionId} IN ${sectionIds}`)
      .orderBy(asc(checklistItems.displayOrder));
  }

  const sectionsWithItems = sections.map((sec) => ({
    ...sec,
    items: items.filter((i) => i.sectionId === sec.id),
  }));

  return {
    ...template,
    sections: sectionsWithItems,
  };
}

// 3. SAVE / UPDATE TEMPLATE WITH IMMUTABLE VERSION SNAPSHOT
export async function saveChecklistTemplate(
  restaurantId: string,
  templateData: {
    id?: string;
    title: string;
    description?: string;
    code?: string;
    frequency?: string;
    targetTime?: string;
    sections: Array<{
      id?: string;
      sectionCode?: string;
      title: string;
      description?: string;
      sectionType: string;
      displayOrder: number;
      items: Array<{
        id?: string;
        label: string;
        description?: string;
        fieldType: string;
        options?: string[];
        isRequired?: boolean;
        allowsRemarks?: boolean;
        remarksRequired?: boolean;
        defaultValue?: string;
        calculationFormula?: any;
        displayOrder: number;
      }>;
    }>;
  },
  user: ChecklistUserContext
) {
  let templateId = templateData.id;
  let newVersion = 1;

  if (templateId) {
    const [existing] = await db
      .select()
      .from(checklistTemplates)
      .where(and(eq(checklistTemplates.id, templateId), eq(checklistTemplates.restaurantId, restaurantId)))
      .limit(1);

    if (!existing) throw new Error("Template not found or unauthorized");

    newVersion = Number(existing.currentVersion || 1) + 1;

    await db
      .update(checklistTemplates)
      .set({
        title: templateData.title.trim(),
        description: templateData.description || null,
        frequency: templateData.frequency || existing.frequency,
        targetTime: templateData.targetTime || existing.targetTime,
        currentVersion: String(newVersion),
        updatedAt: new Date(),
      })
      .where(eq(checklistTemplates.id, templateId));

    // Delete existing items & sections for this template
    const oldSections = await db
      .select()
      .from(checklistSections)
      .where(eq(checklistSections.templateId, templateId));

    const oldSecIds = oldSections.map((s) => s.id);
    if (oldSecIds.length > 0) {
      await db.delete(checklistItems).where(sql`${checklistItems.sectionId} IN ${oldSecIds}`);
    }
    await db.delete(checklistSections).where(eq(checklistSections.templateId, templateId));
  } else {
    // Insert new template
    const cleanCode = (templateData.code || templateData.title)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "_")
      .slice(0, 50);

    const [created] = await db
      .insert(checklistTemplates)
      .values({
        restaurantId,
        title: templateData.title.trim(),
        description: templateData.description || null,
        code: cleanCode,
        frequency: templateData.frequency || "daily",
        targetTime: templateData.targetTime || "10:00 AM",
        isActive: true,
        currentVersion: "1",
        createdBy: user.id,
      })
      .returning();

    templateId = created.id;
  }

  // Insert Sections & Items
  const insertedSectionsWithItems: any[] = [];

  for (let sIdx = 0; sIdx < templateData.sections.length; sIdx++) {
    const s = templateData.sections[sIdx];
    const [createdSec] = await db
      .insert(checklistSections)
      .values({
        templateId: templateId!,
        version: String(newVersion),
        sectionCode: s.sectionCode || String.fromCharCode(65 + sIdx),
        title: s.title.trim(),
        description: s.description || null,
        sectionType: s.sectionType || "checklist",
        displayOrder: String(s.displayOrder || sIdx + 1),
      })
      .returning();

    const itemsToInsert = (s.items || []).map((it, itIdx) => ({
      sectionId: createdSec.id,
      label: it.label.trim(),
      description: it.description || null,
      fieldType: it.fieldType || "checkbox",
      options: it.options || null,
      isRequired: it.isRequired ?? false,
      allowsRemarks: it.allowsRemarks ?? true,
      remarksRequired: it.remarksRequired ?? false,
      defaultValue: it.defaultValue || null,
      calculationFormula: it.calculationFormula || null,
      displayOrder: String(it.displayOrder || itIdx + 1),
    }));

    let createdItems: any[] = [];
    if (itemsToInsert.length > 0) {
      createdItems = await db.insert(checklistItems).values(itemsToInsert).returning();
    }

    insertedSectionsWithItems.push({
      ...createdSec,
      items: createdItems,
    });
  }

  // Save Immutable Template Version Snapshot
  const fullSnapshot = {
    templateId,
    version: newVersion,
    title: templateData.title,
    sections: insertedSectionsWithItems,
  };

  await db.insert(checklistTemplateVersions).values({
    templateId: templateId!,
    version: String(newVersion),
    structureSnapshot: fullSnapshot,
    changeSummary: `Updated to version ${newVersion} by ${user.name}`,
    createdBy: user.id,
  });

  return { id: templateId, version: newVersion };
}

// 4. GET OR CREATE DAILY CHECKLIST RECORD FOR A SPECIFIC DATE
export async function getOrCreateDailyChecklist(
  restaurantId: string,
  templateIdOrCode: string | null,
  dateStr: string, // YYYY-MM-DD
  user: ChecklistUserContext
) {
  // Determine template
  let template: any;
  if (templateIdOrCode) {
    const [found] = await db
      .select()
      .from(checklistTemplates)
      .where(
        and(
          eq(checklistTemplates.restaurantId, restaurantId),
          sql`(${checklistTemplates.id}::text = ${templateIdOrCode} OR ${checklistTemplates.code} = ${templateIdOrCode})`
        )
      )
      .limit(1);
    template = found;
  }

  if (!template) {
    const templates = await getChecklistTemplates(restaurantId);
    template = templates[0];
  }

  if (!template) {
    throw new Error("No checklist templates configured");
  }

  // Look for existing daily record for (restaurantId, templateId, dateStr)
  let [dailyRecord] = await db
    .select()
    .from(dailyChecklistRecords)
    .where(
      and(
        eq(dailyChecklistRecords.restaurantId, restaurantId),
        eq(dailyChecklistRecords.templateId, template.id),
        eq(dailyChecklistRecords.date, dateStr)
      )
    )
    .limit(1);

  if (!dailyRecord) {
    // Fetch template structure snapshot
    const templateWithStructure = await getChecklistTemplateWithStructure(template.id, restaurantId);
    
    // Count total required items
    let totalReq = 0;
    templateWithStructure?.sections?.forEach((sec: any) => {
      sec.items?.forEach((item: any) => {
        if (item.isRequired) totalReq++;
      });
    });

    [dailyRecord] = await db
      .insert(dailyChecklistRecords)
      .values({
        restaurantId,
        templateId: template.id,
        versionNumber: template.currentVersion || "1",
        date: dateStr,
        status: "not_started",
        completionPercent: "0",
        completedItemsCount: "0",
        totalRequiredItemsCount: String(totalReq),
        structureSnapshot: templateWithStructure,
        createdBy: user.id,
      })
      .returning();

    // Repeatable rows are populated by user entry without inserting blank dummy records on initial view
  }

  // Fetch current values
  const values = await db
    .select()
    .from(dailyChecklistValues)
    .where(eq(dailyChecklistValues.dailyRecordId, dailyRecord.id));

  // Fetch repeatable rows
  const repeatableRows = await db
    .select()
    .from(dailyRepeatableRows)
    .where(eq(dailyRepeatableRows.dailyRecordId, dailyRecord.id))
    .orderBy(asc(dailyRepeatableRows.rowIndex));

  // Fetch recent audit logs (last 30)
  const auditLogs = await db
    .select()
    .from(checklistAuditLogs)
    .where(eq(checklistAuditLogs.dailyRecordId, dailyRecord.id))
    .orderBy(desc(checklistAuditLogs.createdAt))
    .limit(30);

  // Return full structure snapshot (or live structure if snapshot not yet populated)
  let structure = dailyRecord.structureSnapshot;
  if (!structure) {
    structure = await getChecklistTemplateWithStructure(template.id, restaurantId);
  }

  // Recalculate metrics to ensure live record is always synced with values
  const recalculated = await recalculateDailyRecordMetrics(dailyRecord.id);
  if (recalculated?.dailyRecord) {
    dailyRecord = recalculated.dailyRecord;
  }

  return {
    dailyRecord,
    template,
    structure,
    values,
    repeatableRows,
    auditLogs,
  };
}

// 4.5 RECALCULATE DAILY RECORD METRICS HELPER
export async function recalculateDailyRecordMetrics(dailyRecordId: string) {
  const [dailyRecord] = await db
    .select()
    .from(dailyChecklistRecords)
    .where(eq(dailyChecklistRecords.id, dailyRecordId))
    .limit(1);

  if (!dailyRecord) return null;

  const allValues = await db
    .select()
    .from(dailyChecklistValues)
    .where(eq(dailyChecklistValues.dailyRecordId, dailyRecordId));

  let structure = dailyRecord.structureSnapshot;
  if (!structure || !structure.sections) {
    structure = await getChecklistTemplateWithStructure(dailyRecord.templateId, dailyRecord.restaurantId);
  }

  let totalRequired = 0;
  let completedRequired = 0;

  structure?.sections?.forEach((sec: any) => {
    sec.items?.forEach((item: any) => {
      const val = allValues.find(
        (v) => v.itemId === item.id || v.itemKey === item.id || v.itemKey === item.label
      );

      let isCompleted = false;
      if (item.fieldType === "checkbox" || item.field_type === "checkbox") {
        isCompleted = val?.valueBoolean === true;
      } else if (item.fieldType === "currency" || item.field_type === "currency" || item.fieldType === "number" || item.field_type === "number") {
        isCompleted = val !== undefined && val.valueNumber !== null && String(val.valueNumber).trim() !== "";
      } else if (item.fieldType === "signature" || item.field_type === "signature") {
        isCompleted = (val !== undefined && !!val.valueText?.trim()) || Boolean(dailyRecord.managerSignature?.trim());
      } else if (item.label === "Opening Manager Name") {
        isCompleted = (val !== undefined && !!val.valueText?.trim()) || Boolean(dailyRecord.openingManagerName?.trim());
      } else {
        isCompleted = val !== undefined && (
          val.valueBoolean === true ||
          (typeof val.valueText === "string" && val.valueText.trim() !== "") ||
          (val.valueNumber !== null && String(val.valueNumber).trim() !== "")
        );
      }

      if (item.isRequired || item.is_required) {
        totalRequired++;
        if (isCompleted) completedRequired++;
      }
    });
  });

  const percent = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 100;
  const status =
    completedRequired === 0
      ? "not_started"
      : completedRequired >= totalRequired
      ? "completed"
      : "in_progress";

  const [updated] = await db
    .update(dailyChecklistRecords)
    .set({
      completionPercent: String(percent.toFixed(2)),
      completedItemsCount: String(completedRequired),
      totalRequiredItemsCount: String(totalRequired),
      status,
      updatedAt: new Date(),
    })
    .where(eq(dailyChecklistRecords.id, dailyRecordId))
    .returning();

  return {
    dailyRecord: updated,
    completionPercent: percent,
    completedItemsCount: completedRequired,
    totalRequiredItemsCount: totalRequired,
    status,
  };
}

// 5. UPDATE DAILY CHECKLIST ITEM VALUE & LOG AUDIT EVENT
export async function updateDailyItemValue(
  dailyRecordId: string,
  itemKey: string,
  payload: {
    itemId?: string;
    sectionId?: string;
    valueBoolean?: boolean;
    valueText?: string;
    valueNumber?: number;
    valueJson?: any;
    remarks?: string;
    sectionTitle?: string;
    itemLabel?: string;
  },
  user: ChecklistUserContext
) {
  const [dailyRecord] = await db
    .select()
    .from(dailyChecklistRecords)
    .where(eq(dailyChecklistRecords.id, dailyRecordId))
    .limit(1);

  if (!dailyRecord) throw new Error("Daily record not found");

  // Check existing value
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

  const prevDisplay = existingValue
    ? existingValue.valueBoolean !== null
      ? String(existingValue.valueBoolean)
      : existingValue.valueText || (existingValue.valueNumber !== null ? String(existingValue.valueNumber) : "")
    : "";

  let newDisplay = "";
  if (payload.valueBoolean !== undefined) newDisplay = String(payload.valueBoolean);
  else if (payload.valueText !== undefined) newDisplay = payload.valueText;
  else if (payload.valueNumber !== undefined) newDisplay = String(payload.valueNumber);
  else if (payload.remarks !== undefined) newDisplay = `Remarks: ${payload.remarks}`;

  if (existingValue) {
    await db
      .update(dailyChecklistValues)
      .set({
        valueBoolean: payload.valueBoolean !== undefined ? payload.valueBoolean : existingValue.valueBoolean,
        valueText: payload.valueText !== undefined ? payload.valueText : existingValue.valueText,
        valueNumber: payload.valueNumber !== undefined ? String(payload.valueNumber) : existingValue.valueNumber,
        valueJson: payload.valueJson !== undefined ? payload.valueJson : existingValue.valueJson,
        remarks: payload.remarks !== undefined ? payload.remarks : existingValue.remarks,
        updatedBy: user.id,
        updatedByName: user.name,
        updatedAt: new Date(),
      })
      .where(eq(dailyChecklistValues.id, existingValue.id));
  } else {
    await db.insert(dailyChecklistValues).values({
      dailyRecordId,
      itemId: payload.itemId || null,
      sectionId: payload.sectionId || null,
      itemKey,
      valueBoolean: payload.valueBoolean ?? null,
      valueText: payload.valueText ?? null,
      valueNumber: payload.valueNumber !== undefined ? String(payload.valueNumber) : null,
      valueJson: payload.valueJson ?? null,
      remarks: payload.remarks ?? null,
      updatedBy: user.id,
      updatedByName: user.name,
    });
  }

  // Recalculate completion metrics for the daily record using robust helper
  const metrics = await recalculateDailyRecordMetrics(dailyRecordId);

  // Determine audit action
  let action = "edit_value";
  if (payload.valueBoolean === true) action = "check";
  else if (payload.valueBoolean === false) action = "uncheck";
  else if (payload.remarks !== undefined) action = "edit_remarks";

  // Insert Audit Log Entry
  await db.insert(checklistAuditLogs).values({
    dailyRecordId,
    restaurantId: dailyRecord.restaurantId,
    userId: user.id,
    userName: user.name,
    action,
    sectionTitle: payload.sectionTitle || "Checklist Item",
    itemLabel: payload.itemLabel || itemKey,
    previousValue: prevDisplay,
    newValue: newDisplay,
    operationalDate: dailyRecord.date,
  });

  return {
    success: true,
    completionPercent: metrics?.completionPercent ?? 0,
    completedItemsCount: metrics?.completedItemsCount ?? 0,
    totalRequiredItemsCount: metrics?.totalRequiredItemsCount ?? 0,
    status: metrics?.status ?? "not_started",
  };
}

// 6. UPDATE REPEATABLE ROWS (FOR PURCHASE & EXPENSE TABLES)
export async function updateRepeatableRows(
  dailyRecordId: string,
  sectionCode: string,
  rows: any[],
  user: ChecklistUserContext
) {
  const [dailyRecord] = await db
    .select()
    .from(dailyChecklistRecords)
    .where(eq(dailyChecklistRecords.id, dailyRecordId))
    .limit(1);

  if (!dailyRecord) throw new Error("Daily record not found");

  // Delete existing rows for this sectionCode
  await db
    .delete(dailyRepeatableRows)
    .where(
      and(
        eq(dailyRepeatableRows.dailyRecordId, dailyRecordId),
        eq(dailyRepeatableRows.sectionCode, sectionCode)
      )
    );

  // Insert new rows
  if (rows.length > 0) {
    const inserts = rows.map((r, idx) => ({
      dailyRecordId,
      sectionCode,
      rowIndex: String(idx + 1),
      data: r,
      createdBy: user.id,
    }));
    await db.insert(dailyRepeatableRows).values(inserts);
  }

  // Log audit
  await db.insert(checklistAuditLogs).values({
    dailyRecordId,
    restaurantId: dailyRecord.restaurantId,
    userId: user.id,
    userName: user.name,
    action: "edit_rows",
    sectionTitle: sectionCode === "purchase" ? "Purchase Quick Record" : "Expense Quick Record",
    itemLabel: `${rows.length} rows updated`,
    previousValue: "",
    newValue: `Updated ${rows.length} records`,
    operationalDate: dailyRecord.date,
  });

  return { success: true, count: rows.length };
}

// 7. UPDATE MANAGER VERIFICATION & HEADER
export async function updateDailyVerification(
  dailyRecordId: string,
  payload: {
    openingManagerName?: string;
    cashierName?: string;
    verifiedByName?: string;
    managerSignature?: string;
    pendingIssues?: string;
  },
  user: ChecklistUserContext
) {
  const [dailyRecord] = await db
    .select()
    .from(dailyChecklistRecords)
    .where(eq(dailyChecklistRecords.id, dailyRecordId))
    .limit(1);

  if (!dailyRecord) throw new Error("Daily record not found");

  const [updated] = await db
    .update(dailyChecklistRecords)
    .set({
      openingManagerName: payload.openingManagerName !== undefined ? payload.openingManagerName : dailyRecord.openingManagerName,
      cashierName: payload.cashierName !== undefined ? payload.cashierName : dailyRecord.cashierName,
      verifiedByName: payload.verifiedByName !== undefined ? payload.verifiedByName : dailyRecord.verifiedByName,
      managerSignature: payload.managerSignature !== undefined ? payload.managerSignature : dailyRecord.managerSignature,
      pendingIssues: payload.pendingIssues !== undefined ? payload.pendingIssues : dailyRecord.pendingIssues,
      verifiedAt: payload.managerSignature ? new Date() : dailyRecord.verifiedAt,
      updatedAt: new Date(),
    })
    .where(eq(dailyChecklistRecords.id, dailyRecordId))
    .returning();

  // Audit log
  await db.insert(checklistAuditLogs).values({
    dailyRecordId,
    restaurantId: dailyRecord.restaurantId,
    userId: user.id,
    userName: user.name,
    action: payload.managerSignature ? "sign" : "verify",
    sectionTitle: "Manager Final Verification",
    itemLabel: payload.openingManagerName || "Manager Sign-off",
    previousValue: "",
    newValue: payload.managerSignature ? "Signed & Verified" : "Updated Verification Details",
    operationalDate: dailyRecord.date,
  });

  const recalc = await recalculateDailyRecordMetrics(dailyRecordId);
  return recalc?.dailyRecord || updated;
}

// 8. GET CHECKLIST HISTORY LIST
export async function getChecklistHistory(
  restaurantId: string,
  templateId?: string,
  limit = 30,
  offset = 0
) {
  let query = db
    .select({
      id: dailyChecklistRecords.id,
      date: dailyChecklistRecords.date,
      status: dailyChecklistRecords.status,
      completionPercent: dailyChecklistRecords.completionPercent,
      completedItemsCount: dailyChecklistRecords.completedItemsCount,
      totalRequiredItemsCount: dailyChecklistRecords.totalRequiredItemsCount,
      openingManagerName: dailyChecklistRecords.openingManagerName,
      managerSignature: dailyChecklistRecords.managerSignature,
      verifiedAt: dailyChecklistRecords.verifiedAt,
      templateTitle: checklistTemplates.title,
      templateCode: checklistTemplates.code,
      updatedAt: dailyChecklistRecords.updatedAt,
    })
    .from(dailyChecklistRecords)
    .innerJoin(checklistTemplates, eq(dailyChecklistRecords.templateId, checklistTemplates.id))
    .where(
      and(
        eq(dailyChecklistRecords.restaurantId, restaurantId),
        sql`(CAST(${dailyChecklistRecords.completedItemsCount} AS integer) > 0 OR ${dailyChecklistRecords.status} != 'not_started' OR ${dailyChecklistRecords.managerSignature} IS NOT NULL OR ${dailyChecklistRecords.openingManagerName} IS NOT NULL OR EXISTS (SELECT 1 FROM daily_checklist_values dcv WHERE dcv.daily_record_id = ${dailyChecklistRecords.id} AND (dcv.value_boolean = true OR (dcv.value_text IS NOT NULL AND dcv.value_text != '') OR dcv.value_number IS NOT NULL)))`
      )
    )
    .orderBy(desc(dailyChecklistRecords.date))
    .limit(limit)
    .offset(offset);

  return query;
}
