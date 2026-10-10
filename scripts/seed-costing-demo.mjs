import pg from "pg";
import fs from "fs";
import path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const idx = trimmed.indexOf("=");
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) process.env[key] = val;
        }
      }
    });
  }
}
loadEnv();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log("Searching for Demo Restaurant...");
const restRes = await client.query(
  "SELECT id, business_name FROM restaurants WHERE business_name ILIKE '%Demo%' LIMIT 1"
);

if (restRes.rows.length === 0) {
  console.error("Demo Restaurant not found!");
  await client.end();
  process.exit(1);
}

const demoRestaurantId = restRes.rows[0].id;
const demoRestaurantName = restRes.rows[0].business_name;
console.log(`Found: ${demoRestaurantName} (ID: ${demoRestaurantId})`);

// 1. Clean existing costing demo data for this restaurant (to avoid duplicate seeds)
console.log("Clearing existing costing data for demo restaurant...");
await client.query("DELETE FROM menu_items WHERE restaurant_id = $1", [demoRestaurantId]);
await client.query("DELETE FROM ingredients WHERE restaurant_id = $1", [demoRestaurantId]);

// 2. Insert Sample Raw Ingredients
console.log("Inserting sample raw ingredients...");
const sampleIngredients = [
  { name: "Malai Paneer", qty: 1, unit: "kg", price: 320.00, notes: "Fresh dairy paneer, daily supply" },
  { name: "Amul Butter", qty: 500, unit: "g", price: 275.00, notes: "Salted cooking butter" },
  { name: "Fresh Cooking Cream", qty: 1, unit: "L", price: 210.00, notes: "Amul Fresh Cream tetra pack" },
  { name: "Tomato Gravy Base", qty: 2, unit: "kg", price: 140.00, notes: "Boiled & strained tomato base" },
  { name: "Cashew Nut Paste", qty: 500, unit: "g", price: 400.00, notes: "Rich white gravy base paste" },
  { name: "Special Garam Masala & Spices", qty: 250, unit: "g", price: 125.00, notes: "House blend ground spice mix" },
  { name: "Spring Roll Sheets", qty: 20, unit: "pcs", price: 90.00, notes: "Pre-rolled frozen pastry sheets" },
  { name: "Cabbage & Carrots Shredded", qty: 1, unit: "kg", price: 50.00, notes: "Fresh prep station vegetables" },
  { name: "Refined Cooking Oil", qty: 5, unit: "L", price: 650.00, notes: "Sunflower frying oil" },
  { name: "Soya & Chilli Sauce Blend", qty: 500, unit: "ml", price: 60.00, notes: "Stir fry seasoning sauce" },
  { name: "Full Cream Milk", qty: 1, unit: "L", price: 66.00, notes: "Dairy pouch milk for coffee & shakes" },
  { name: "Vanilla Ice Cream Scoop", qty: 10, unit: "pcs", price: 180.00, notes: "Scoop portions from 4L tub" },
  { name: "Coffee Decoction Concentrate", qty: 500, unit: "ml", price: 150.00, notes: "Freshly brewed espresso blend" },
  { name: "Sugar Syrup", qty: 1, unit: "L", price: 80.00, notes: "Simple syrup (1:1 sugar & water)" },
  { name: "Hershey Chocolate Sauce", qty: 500, unit: "ml", price: 140.00, notes: "Glass garnish & topping" },
  { name: "Black Lentils (Urad & Rajma)", qty: 1, unit: "kg", price: 140.00, notes: "Premium whole black gram" },
  { name: "Ginger Garlic Paste", qty: 250, unit: "g", price: 50.00, notes: "Fresh ground cooking paste" },
];

const insertedIngredients = new Map();

for (const ing of sampleIngredients) {
  // calculate cost per base unit
  let baseFactor = 1;
  if (ing.unit === "kg" || ing.unit === "L") baseFactor = 1000;
  const baseQty = ing.qty * baseFactor;
  const costPerBase = (ing.price / baseQty).toFixed(6);

  const res = await client.query(
    `INSERT INTO ingredients (restaurant_id, name, purchase_quantity, purchase_unit, purchase_price, cost_per_base_unit, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name`,
    [demoRestaurantId, ing.name, ing.qty, ing.unit, ing.price, costPerBase, ing.notes]
  );
  insertedIngredients.set(ing.name, res.rows[0].id);
}

console.log(`Inserted ${insertedIngredients.size} raw ingredients.`);

// 3. Insert Menu Items with Recipes & SOPs
console.log("Inserting sample menu items, recipes, and SOPs...");

const sampleDishes = [
  {
    name: "Paneer Butter Masala",
    sellingPrice: 280.00,
    category: "Main Course",
    description: "Cottage cheese cubes simmered in a velvety buttery tomato and cashew gravy.",
    ingredients: [
      { name: "Malai Paneer", qty: 200, unit: "g" },
      { name: "Amul Butter", qty: 30, unit: "g" },
      { name: "Fresh Cooking Cream", qty: 40, unit: "ml" },
      { name: "Tomato Gravy Base", qty: 150, unit: "g" },
      { name: "Cashew Nut Paste", qty: 25, unit: "g" },
      { name: "Special Garam Masala & Spices", qty: 10, unit: "g" },
    ],
    steps: [
      "Melt 30g Amul butter in a warm pan over medium flame.",
      "Add 150g tomato gravy base and sauté for 2 minutes until glossy and oil separates.",
      "Whisk in 25g cashew paste with 50ml warm water; simmer on low heat for 3 minutes.",
      "Gently fold in 200g diced Malai Paneer and 10g special spice mix without breaking paneer cubes.",
      "Finish with 40ml fresh cooking cream and crushed kasuri methi; garnish with fresh coriander.",
    ],
  },
  {
    name: "Crispy Veg Spring Rolls",
    sellingPrice: 180.00,
    category: "Starters",
    description: "Golden crispy rolls stuffed with wok-tossed seasoned vegetables served with sweet chili dip.",
    ingredients: [
      { name: "Spring Roll Sheets", qty: 4, unit: "pcs" },
      { name: "Cabbage & Carrots Shredded", qty: 120, unit: "g" },
      { name: "Refined Cooking Oil", qty: 40, unit: "ml" },
      { name: "Soya & Chilli Sauce Blend", qty: 20, unit: "ml" },
      { name: "Ginger Garlic Paste", qty: 10, unit: "g" },
    ],
    steps: [
      "In a hot wok, toss shredded cabbage and carrots with ginger-garlic paste and sauces on high flame for 90 seconds (keep veggies crunchy).",
      "Spread filling on a flat tray and cool completely to prevent wrappers from turning soggy.",
      "Place 35g filling onto each pastry sheet, roll tightly, and seal edges with light cornstarch paste.",
      "Deep fry in clean vegetable oil at 175°C for 3 to 4 minutes until light golden and crispy.",
      "Drain on paper towel, cut diagonally at 45 degrees, and serve with sweet chili dipping sauce.",
    ],
  },
  {
    name: "Classic Cold Coffee with Ice Cream",
    sellingPrice: 150.00,
    category: "Beverages",
    description: "Thick frothy blended coffee poured into a chocolate-swirled glass topped with vanilla ice cream.",
    ingredients: [
      { name: "Full Cream Milk", qty: 200, unit: "ml" },
      { name: "Vanilla Ice Cream Scoop", qty: 1, unit: "pcs" },
      { name: "Coffee Decoction Concentrate", qty: 30, unit: "ml" },
      { name: "Sugar Syrup", qty: 25, unit: "ml" },
      { name: "Hershey Chocolate Sauce", qty: 15, unit: "ml" },
    ],
    steps: [
      "Keep the serving glass inside the freezer for 10 minutes prior to order assembly.",
      "In a high-speed blender, combine 200ml cold milk, 30ml coffee decoction, 25ml sugar syrup, and 3 ice cubes.",
      "Blend on pulse mode for 25 seconds until a thick, frothy crema forms on top.",
      "Drizzle 15ml chocolate sauce along the inside walls of the chilled glass.",
      "Pour cold coffee blend gently and crown with one scoop of vanilla ice cream.",
    ],
  },
  {
    name: "Dal Makhani",
    sellingPrice: 240.00,
    category: "Main Course",
    description: "Overnight slow-cooked black lentils in rich butter and fresh cream gravy.",
    ingredients: [
      { name: "Black Lentils (Urad & Rajma)", qty: 100, unit: "g" },
      { name: "Amul Butter", qty: 40, unit: "g" },
      { name: "Tomato Gravy Base", qty: 80, unit: "g" },
      { name: "Fresh Cooking Cream", qty: 30, unit: "ml" },
      { name: "Ginger Garlic Paste", qty: 15, unit: "g" },
    ],
    steps: [
      "Slow-simmer pre-boiled black lentils with tomato base and ginger-garlic paste for 40 minutes on low flame.",
      "Mash lightly with ladle back to achieve a smooth creamy restaurant texture.",
      "Whisk in 40g butter in two stages while stirring continuously.",
      "Season with garam masala and Kashmiri chili; cook for final 10 minutes.",
      "Swirl 30ml fresh cream on top in concentric circles right before leaving the kitchen pass.",
    ],
  },
];

for (const dish of sampleDishes) {
  const itemRes = await client.query(
    `INSERT INTO menu_items (restaurant_id, name, selling_price, category, description, is_active)
     VALUES ($1, $2, $3, $4, $5, true)
     RETURNING id`,
    [demoRestaurantId, dish.name, dish.sellingPrice, dish.category, dish.description]
  );
  const menuItemId = itemRes.rows[0].id;

  // Insert ingredients
  for (const ing of dish.ingredients) {
    const ingredientId = insertedIngredients.get(ing.name);
    if (ingredientId) {
      await client.query(
        `INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit)
         VALUES ($1, $2, $3, $4)`,
        [menuItemId, ingredientId, ing.qty, ing.unit]
      );
    }
  }

  // Insert steps
  for (let i = 0; i < dish.steps.length; i++) {
    await client.query(
      `INSERT INTO menu_item_steps (menu_item_id, step_number, instruction)
       VALUES ($1, $2, $3)`,
      [menuItemId, i + 1, dish.steps[i]]
    );
  }

  console.log(`✓ Seeded dish: "${dish.name}" with ${dish.ingredients.length} ingredients and ${dish.steps.length} SOP steps.`);
}

console.log("\n========================================================");
console.log(`Demo Restaurant Menu Costing Seed Completed Successfully!`);
console.log(`Restaurant: ${demoRestaurantName}`);
console.log(`Total Ingredients: ${sampleIngredients.length}`);
console.log(`Total Dishes: ${sampleDishes.length}`);
console.log("========================================================\n");

await client.end();
