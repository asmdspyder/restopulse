export const DEFAULT_CATEGORIES = [
  { name: "Food", isDefault: true },
  { name: "Beverage", isDefault: true },
  { name: "Ingredient", isDefault: true },
  { name: "Packaging", isDefault: true },
  { name: "Other", isDefault: true },
];

export const DEFAULT_UNITS = [
  { name: "Kilogram", symbol: "kg" },
  { name: "Gram", symbol: "g" },
  { name: "Liter", symbol: "L" },
  { name: "Milliliter", symbol: "ml" },
  { name: "Pieces", symbol: "pcs" },
  { name: "Portion", symbol: "portion" },
  { name: "Pack", symbol: "pack" },
  { name: "Bottle", symbol: "bottle" },
  { name: "Tray", symbol: "tray" },
];

export const DEFAULT_WASTAGE_REASONS = [
  { name: "Over-preparation", isDefault: true },
  { name: "Over-portioning", isDefault: true },
  { name: "Spoilage", isDefault: true },
  { name: "Expired", isDefault: true },
  { name: "Burnt / Cooking error", isDefault: true },
  { name: "Wrong order", isDefault: true },
  { name: "Remake", isDefault: true },
  { name: "Trimming loss", isDefault: true },
  { name: "Spillage", isDefault: true },
  { name: "Damaged", isDefault: true },
  { name: "Staff meal", isDefault: true },
  { name: "Other", isDefault: true },
];

export const DEFAULT_SAMPLE_ITEMS = [
  { name: "Cooked Rice", category: "Food", defaultUnit: "kg", costPerUnit: "95.00", defaultResponsibleArea: "Kitchen" },
  { name: "Chicken Breast", category: "Ingredient", defaultUnit: "kg", costPerUnit: "320.00", defaultResponsibleArea: "Kitchen" },
  { name: "Fresh Milk", category: "Beverage", defaultUnit: "L", costPerUnit: "65.00", defaultResponsibleArea: "Bar" },
  { name: "Coffee Beans", category: "Beverage", defaultUnit: "kg", costPerUnit: "950.00", defaultResponsibleArea: "Bar" },
  { name: "Butter Croissant", category: "Food", defaultUnit: "pcs", costPerUnit: "45.00", defaultResponsibleArea: "Bakery" },
  { name: "Tomato Sauce / Gravy", category: "Ingredient", defaultUnit: "L", costPerUnit: "140.00", defaultResponsibleArea: "Kitchen" },
  { name: "Takeaway Containers", category: "Packaging", defaultUnit: "pcs", costPerUnit: "8.50", defaultResponsibleArea: "Service" },
];
