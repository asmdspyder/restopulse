import { db } from "@/lib/db";
import {
  checklistTemplates,
  checklistTemplateVersions,
  checklistSections,
  checklistItems,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const DEFAULT_OPENING_CHECKLIST = {
  title: "Opening Checklist",
  code: "OPENING_CHECKLIST",
  description: "Standard daily opening checklist covering dining, kitchen, cash counter, customer service, purchase & expenses, and manager verification.",
  frequency: "daily",
  targetTime: "10:00 AM",
  sections: [
    {
      sectionCode: "A",
      title: "Restaurant & Dining Area",
      description: "Dining hall cleanliness, ambiance, and table readiness",
      sectionType: "checklist",
      displayOrder: 1,
      items: [
        { label: "Restaurant swept & mopped", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Tables & chairs cleaned", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Table top items arranged", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Tissue holders refilled", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Dustbins emptied", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Handwash area cleaned", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Glass door / Entrance cleaned", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Fans & lights checked", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Water bottles / Glasses arranged", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Restaurant smell check", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
      ],
    },
    {
      sectionCode: "B",
      title: "Kitchen Area",
      description: "Kitchen hygiene, equipment check, gas safety, and raw material availability",
      sectionType: "checklist",
      displayOrder: 2,
      items: [
        { label: "Kitchen floor clean", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Work platforms clean", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Burners clean", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Fryer clean", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Kitchen equipment clean", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Gas connection checked", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Gas leakage check", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Exhaust / chimney checked", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Refrigerator working", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Raw chicken available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Vegetables available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Rice available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Noodles available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Sauces available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Oil & other ingredients available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Kitchen equipment checked", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
      ],
    },
    {
      sectionCode: "C",
      title: "Cash Counter & POS",
      description: "Billing hardware, POS connectivity, float cash, and payment QR",
      sectionType: "checklist",
      displayOrder: 3,
      items: [
        { label: "Opening cash counted", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Previous day cash verified", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Change available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "UPI QR working", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "POS system switched on", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Billing printer working", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
      ],
    },
    {
      sectionCode: "D",
      title: "Customer Service Items",
      description: "Cutlery, packaging, condiments, and guest amenities",
      sectionType: "checklist",
      displayOrder: 4,
      items: [
        { label: "Drinking water available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Water glasses clean & ready", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Tissue papers available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Toothpicks available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Spoons / Forks available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Carry bags available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Takeaway containers available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Sauce sachets available", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
      ],
    },
    {
      sectionCode: "E",
      title: "Staff Readiness",
      description: "Attendance and grooming standards",
      sectionType: "checklist",
      displayOrder: 5,
      items: [
        { label: "Staff attendance marked", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
        { label: "Hairnet worn", fieldType: "checkbox", isRequired: true, allowsRemarks: true },
      ],
    },
    {
      sectionCode: "F",
      title: "Purchase & Expense Quick Record",
      description: "Daily morning procurement and spot expense log",
      sectionType: "table_purchase_expense",
      displayOrder: 6,
      items: [
        { label: "Total Purchase", fieldType: "currency", isRequired: false, allowsRemarks: false },
        { label: "Total Expense", fieldType: "currency", isRequired: false, allowsRemarks: false },
        { label: "Purchase + Expense", fieldType: "currency", isRequired: false, allowsRemarks: false },
      ],
    },
    {
      sectionCode: "G",
      title: "Opening Cash Record",
      description: "Drawer cash reconciliation and cashier handover",
      sectionType: "opening_cash",
      displayOrder: 7,
      items: [
        { label: "Opening Cash in Drawer", fieldType: "currency", isRequired: true, allowsRemarks: false },
        { label: "Small Change Available", fieldType: "currency", isRequired: true, allowsRemarks: false },
        { label: "Total Opening Cash", fieldType: "currency", isRequired: true, allowsRemarks: false },
        { label: "Verified By Manager", fieldType: "short_text", isRequired: false, allowsRemarks: false },
        { label: "Cashier Name", fieldType: "short_text", isRequired: false, allowsRemarks: false },
      ],
    },
    {
      sectionCode: "H",
      title: "Opening Summary",
      description: "Overall readiness overview across key restaurant stations",
      sectionType: "summary",
      displayOrder: 8,
      items: [],
    },
    {
      sectionCode: "I",
      title: "Manager Final Verification",
      description: "Final opening authorization and sign-off",
      sectionType: "verification",
      displayOrder: 9,
      items: [
        { label: "Pending Issue (If Any)", fieldType: "long_text", isRequired: false, allowsRemarks: false },
        { label: "Opening Manager Name", fieldType: "short_text", isRequired: true, allowsRemarks: false },
        { label: "Manager Signature", fieldType: "signature", isRequired: true, allowsRemarks: false },
      ],
    },
  ],
};

export async function seedOpeningChecklist(restaurantId: string, createdByUserId?: string) {
  const [existing] = await db
    .select()
    .from(checklistTemplates)
    .where(eq(checklistTemplates.restaurantId, restaurantId))
    .limit(1);

  if (existing) {
    return existing;
  }

  // 1. Insert Template
  const [template] = await db
    .insert(checklistTemplates)
    .values({
      restaurantId,
      title: DEFAULT_OPENING_CHECKLIST.title,
      code: DEFAULT_OPENING_CHECKLIST.code,
      description: DEFAULT_OPENING_CHECKLIST.description,
      frequency: DEFAULT_OPENING_CHECKLIST.frequency,
      targetTime: DEFAULT_OPENING_CHECKLIST.targetTime,
      isActive: true,
      currentVersion: "1",
      createdBy: createdByUserId || null,
    })
    .returning();

  const sectionsToInsert: any[] = [];
  const itemsToInsertMap: { [sectionIndex: number]: any[] } = {};

  DEFAULT_OPENING_CHECKLIST.sections.forEach((sec, idx) => {
    sectionsToInsert.push({
      templateId: template.id,
      version: "1",
      sectionCode: sec.sectionCode,
      title: sec.title,
      description: sec.description,
      sectionType: sec.sectionType,
      displayOrder: String(sec.displayOrder),
    });
    itemsToInsertMap[idx] = sec.items || [];
  });

  // 2. Insert Sections
  const insertedSections = await db
    .insert(checklistSections)
    .values(sectionsToInsert)
    .returning();

  // 3. Insert Items for each section
  const allItems: any[] = [];
  insertedSections.forEach((secRecord, idx) => {
    const rawItems = itemsToInsertMap[idx] || [];
    rawItems.forEach((item, itemIdx) => {
      allItems.push({
        sectionId: secRecord.id,
        label: item.label,
        description: (item as any).description || null,
        fieldType: item.fieldType,
        options: (item as any).options || null,
        isRequired: item.isRequired,
        allowsRemarks: item.allowsRemarks,
        remarksRequired: (item as any).remarksRequired || false,
        defaultValue: (item as any).defaultValue || null,
        calculationFormula: (item as any).calculationFormula || null,
        displayOrder: String(itemIdx + 1),
      });
    });
  });

  let insertedItems: any[] = [];
  if (allItems.length > 0) {
    insertedItems = await db.insert(checklistItems).values(allItems).returning();
  }

  // 4. Create Initial Version Snapshot (v1)
  const fullSnapshot = {
    templateId: template.id,
    version: 1,
    title: template.title,
    code: template.code,
    sections: insertedSections.map((s) => ({
      ...s,
      items: insertedItems.filter((i) => i.sectionId === s.id),
    })),
  };

  await db.insert(checklistTemplateVersions).values({
    templateId: template.id,
    version: "1",
    structureSnapshot: fullSnapshot,
    changeSummary: "Initial Opening Checklist seeded from reference standard",
    createdBy: createdByUserId || null,
  });

  return template;
}
