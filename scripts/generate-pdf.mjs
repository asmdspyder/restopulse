import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEMO_ASSETS_DIR = path.resolve(process.cwd(), 'public/demo-assets');
const OUTPUT_PDF = path.resolve(process.cwd(), 'RestoPulse_Restaurant_Operations_Guide.pdf');
const PUBLIC_PDF = path.resolve(process.cwd(), 'public/RestoPulse_Restaurant_Operations_Guide.pdf');

function getBase64Image(filename) {
  const filePath = path.join(DEMO_ASSETS_DIR, filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

async function generatePDF() {
  console.log('Loading demo screenshots as base64...');
  const imgDashboard = getBase64Image('1_dashboard.png');
  const imgWastage = getBase64Image('2_wastage.png');
  const imgMenuCosting = getBase64Image('3_menu_costing.png');
  const imgOverhead = getBase64Image('3b_overhead_tab.png');
  const imgChecklists = getBase64Image('4_checklists.png');
  const imgTeam = getBase64Image('5_team.png');

  console.log('Generating sleek HTML presentation template...');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RestoPulse - Restaurant Operations & Profit System</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      font-size: 11pt;
      line-height: 1.5;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      padding: 18mm 20mm 15mm 20mm;
      position: relative;
      background: #ffffff;
      page-break-after: always;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Top Brand Header on inner pages */
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 3.5mm;
      margin-bottom: 5mm;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 2.5mm;
    }
    .brand-badge {
      width: 8mm;
      height: 8mm;
      background: #047857;
      color: #ffffff;
      border-radius: 2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 11pt;
    }
    .brand-name {
      font-size: 13pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-name span {
      color: #047857;
    }
    .header-tagline {
      font-size: 8.5pt;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Footer on all pages */
    .footer-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 3.5mm;
      margin-top: 4mm;
      font-size: 8pt;
      color: #94a3b8;
    }
    .footer-bar strong {
      color: #047857;
    }

    /* Page 1: COVER HERO */
    .cover-page {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 40%, #022c22 100%);
      color: #ffffff;
      padding: 24mm 22mm 20mm 22mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .cover-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .cover-badge-pill {
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 1.5mm 4mm;
      border-radius: 20mm;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #a7f3d0;
    }
    .cover-center {
      margin-top: 10mm;
      margin-bottom: 8mm;
    }
    .cover-title {
      font-size: 32pt;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -1px;
      color: #ffffff;
      margin-bottom: 4mm;
    }
    .cover-title span {
      color: #34d399;
    }
    .cover-subtitle {
      font-size: 13.5pt;
      font-weight: 500;
      color: #d1fae5;
      line-height: 1.45;
      max-width: 155mm;
    }
    .cover-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4mm;
      margin-top: 7mm;
    }
    .cover-card {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 4mm 4.5mm;
      border-radius: 3mm;
      backdrop-filter: blur(10px);
    }
    .cover-card-icon {
      font-size: 15pt;
      margin-bottom: 1.5mm;
    }
    .cover-card-title {
      font-size: 10.5pt;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 1mm;
    }
    .cover-card-desc {
      font-size: 8.5pt;
      color: #a7f3d0;
      line-height: 1.35;
    }
    .cover-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: 4mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #d1fae5;
    }

    /* Content Layout */
    .module-hero {
      margin-bottom: 3.5mm;
    }
    .module-category {
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #047857;
      display: inline-block;
      margin-bottom: 1mm;
    }
    .module-title {
      font-size: 19pt;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      line-height: 1.2;
    }
    .module-summary {
      font-size: 10pt;
      color: #475569;
      margin-top: 1.5mm;
      line-height: 1.4;
    }

    /* Screenshot Container */
    .screenshot-frame {
      border-radius: 3mm;
      border: 1.5px solid #cbd5e1;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07);
      margin: 3.5mm 0;
      background: #f1f5f9;
      position: relative;
    }
    .screenshot-frame img {
      width: 100%;
      height: auto;
      display: block;
    }

    /* Two-column info cards */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.5mm;
      margin-top: 2.5mm;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 2.5mm;
      padding: 3mm 3.5mm;
    }
    .info-card.benefit {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }
    .info-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1mm;
      display: flex;
      align-items: center;
      gap: 1.5mm;
    }
    .benefit .info-title {
      color: #065f46;
    }
    .info-text {
      font-size: 8.5pt;
      color: #334155;
      line-height: 1.4;
    }

    /* Steps list */
    .steps-container {
      margin-top: 2mm;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 2mm;
      margin-bottom: 1.8mm;
      font-size: 8.5pt;
      color: #334155;
      line-height: 1.35;
    }
    .step-number {
      width: 4.5mm;
      height: 4.5mm;
      border-radius: 50%;
      background: #047857;
      color: #ffffff;
      font-size: 7pt;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 0.3mm;
    }

    /* Final CTA Page */
    .cta-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: 3.5mm;
      padding: 7mm 8mm;
      margin: 4mm 0;
      text-align: center;
    }
    .cta-title {
      font-size: 16pt;
      font-weight: 900;
      color: #34d399;
      margin-bottom: 2mm;
    }
    .cta-desc {
      font-size: 10pt;
      color: #cbd5e1;
      max-width: 140mm;
      margin: 0 auto 4mm auto;
      line-height: 1.45;
    }
    .benefits-summary {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 3.5mm;
      margin-top: 4mm;
    }
    .b-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 4mm;
      border-radius: 3mm;
      text-align: center;
    }
    .b-box-num {
      font-size: 18pt;
      font-weight: 900;
      color: #047857;
      margin-bottom: 1mm;
    }
    .b-box-label {
      font-size: 8.5pt;
      font-weight: 700;
      color: #334155;
    }
  </style>
</head>
<body>

  <!-- ================= PAGE 1: COVER PAGE ================= -->
  <div class="page cover-page">
    <div class="cover-top">
      <div class="brand-logo">
        <div class="brand-badge" style="background:#ffffff; color:#047857;">RP</div>
        <div class="brand-name" style="color:#ffffff;">Resto<span>Pulse</span></div>
      </div>
      <div class="cover-badge-pill">Restaurant Operations Platform</div>
    </div>

    <div class="cover-center">
      <h1 class="cover-title">
        Stop Kitchen Leaks.<br />
        Know Your <span>Real Profit</span><br />
        On Every Single Dish.
      </h1>
      <p class="cover-subtitle">
        A simple, powerful operational system designed for restaurant owners and chefs. Cut food waste, lock in recipe margins, and keep kitchens spotless every shift.
      </p>

      <div class="cover-grid">
        <div class="cover-card">
          <div class="cover-card-icon">🍲</div>
          <div class="cover-card-title">Dish Costing & Recipes</div>
          <div class="cover-card-desc">Accurate portion costs, live food margin % & chef SOP cooking instructions.</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-icon">🏢</div>
          <div class="cover-card-title">Overheads & Bills Allocation</div>
          <div class="cover-card-desc">Factors in monthly rent, staff salaries & electricity to reveal real take-home profit.</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-icon">🗑️</div>
          <div class="cover-card-title">Food Waste Tracker</div>
          <div class="cover-card-desc">Fast 10-second waste logging by shift & reason. Cut wastage costs by 30–40%.</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-icon">📋</div>
          <div class="cover-card-title">Kitchen Checklists & Audits</div>
          <div class="cover-card-desc">Daily opening/closing SOPs with required photo proof for guaranteed consistency.</div>
        </div>
      </div>
    </div>

    <div class="cover-bottom">
      <div><strong>Product Demo & Feature Walkthrough Guide</strong></div>
      <div>Compatible with Any Phone, Tablet or Laptop</div>
    </div>
  </div>


  <!-- ================= PAGE 2: DASHBOARD ================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Module 1 • Executive Command Center</div>
      </div>

      <div class="module-hero">
        <span class="module-category">Daily Operations Pulse</span>
        <h2 class="module-title">Operations Dashboard</h2>
        <p class="module-summary">
          Your restaurant's central pulse. View daily sales revenue, food waste percentage, and overall financial health at a single glance without digging through spreadsheets.
        </p>
      </div>

      <div class="screenshot-frame">
        <img src="${imgDashboard}" alt="RestoPulse Operations Dashboard" />
      </div>

      <div class="info-grid">
        <div class="info-card benefit">
          <div class="info-title">💡 Why Restaurant Owners Love This</div>
          <p class="info-text">
            Restaurant owners are busy. In 30 seconds every morning, you immediately see if yesterday was profitable, whether kitchen food waste exceeded your 3% safe limit, and which shifts need attention.
          </p>
        </div>

        <div class="info-card">
          <div class="info-title">⚡ How To Use It in 3 Steps</div>
          <div class="steps-container">
            <div class="step-item">
              <div class="step-number">1</div>
              <div>Check the <strong>Waste-to-Sales Gauge</strong> (Green = Safe, Red = Alert).</div>
            </div>
            <div class="step-item">
              <div class="step-number">2</div>
              <div>Review <strong>High-Loss Ingredients</strong> to spot expensive leaks.</div>
            </div>
            <div class="step-item">
              <div class="step-number">3</div>
              <div>Track <strong>Yesterday's Sales vs Today</strong> to monitor growth trends.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Executive Operations Dashboard</strong></div>
      <div>Page 2 of 7</div>
    </div>
  </div>


  <!-- ================= PAGE 3: MENU COSTING & RECIPES ================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Module 2 • Profit Engineering</div>
      </div>

      <div class="module-hero">
        <span class="module-category">Menu Economics & Consistency</span>
        <h2 class="module-title">Dish Costing & Recipes</h2>
        <p class="module-summary">
          Never guess if a dish is making or losing money. Calculate exact ingredient prep costs, live food margins, and store step-by-step cooking SOPs so any chef cooks with identical quality.
        </p>
      </div>

      <div class="screenshot-frame">
        <img src="${imgMenuCosting}" alt="RestoPulse Dish Costing & Recipes" />
      </div>

      <div class="info-grid">
        <div class="info-card benefit">
          <div class="info-title">💡 Real Business Value</div>
          <p class="info-text">
            When raw ingredient prices spike (e.g. oil or chicken), RestoPulse automatically updates making costs across all affected dishes. You spot low-margin menu items before they hurt your monthly bank balance.
          </p>
        </div>

        <div class="info-card">
          <div class="info-title">⚡ How It Works</div>
          <div class="steps-container">
            <div class="step-item">
              <div class="step-number">1</div>
              <div>Add <strong>Raw Ingredients</strong> with standard purchase rates (e.g., 1kg Paneer @ ₹320).</div>
            </div>
            <div class="step-item">
              <div class="step-number">2</div>
              <div>Build <strong>Dish Recipes</strong> with exact portion sizes per serving (e.g., 150g).</div>
            </div>
            <div class="step-item">
              <div class="step-number">3</div>
              <div>See exact <strong>Food Margin %</strong> & <strong>Est. Take-Home Profit</strong> live.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Dish Costing & Recipes</strong></div>
      <div>Page 3 of 7</div>
    </div>
  </div>


  <!-- ================= PAGE 4: OVERHEADS & BILLS ================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Module 3 • True Profit Protection</div>
      </div>

      <div class="module-hero">
        <span class="module-category">Real World Cost Allocation</span>
        <h2 class="module-title">Restaurant Overheads & Bills</h2>
        <p class="module-summary">
          A dish with a 65% food margin might still lose money once you pay restaurant rent and staff salaries. This module allocates your monthly fixed bills to every dish to reveal your real take-home profit.
        </p>
      </div>

      <div class="screenshot-frame">
        <img src="${imgOverhead}" alt="RestoPulse Restaurant Overheads" />
      </div>

      <div class="info-grid">
        <div class="info-card benefit">
          <div class="info-title">💡 Why This Solves a Big Problem</div>
          <p class="info-text">
            Most restaurant POS software only calculates food cost. RestoPulse factors in monthly rent, kitchen staff salaries, and electricity bills so you know exactly how much net cash each plate generates.
          </p>
        </div>

        <div class="info-card">
          <div class="info-title">⚡ 2 Easy Ways to Set Up</div>
          <div class="steps-container">
            <div class="step-item">
              <div class="step-number">A</div>
              <div><strong>Auto-Calculate from Bills:</strong> Enter monthly sales + click 1-click bills (Rent, Salaries, Electricity). RestoPulse computes your % rate automatically.</div>
            </div>
            <div class="step-item">
              <div class="step-number">B</div>
              <div><strong>Enter Fixed %:</strong> If you already know your rate, enter a flat overhead rate (e.g. 20%) in 5 seconds.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Overheads & Bills Allocation</strong></div>
      <div>Page 4 of 7</div>
    </div>
  </div>


  <!-- ================= PAGE 5: FOOD WASTAGE TRACKER ================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Module 4 • Waste Reduction</div>
      </div>

      <div class="module-hero">
        <span class="module-category">Kitchen Efficiency</span>
        <h2 class="module-title">Food Wastage Tracker</h2>
        <p class="module-summary">
          The average restaurant loses 4% to 8% of purchases directly into the kitchen bin. RestoPulse gives your staff a fast 10-second logger to track what was wasted, how much, and why.
        </p>
      </div>

      <div class="screenshot-frame">
        <img src="${imgWastage}" alt="RestoPulse Food Wastage Tracker" />
      </div>

      <div class="info-grid">
        <div class="info-card benefit">
          <div class="info-title">💡 What Gets Measured Gets Controlled</div>
          <p class="info-text">
            When kitchen staff know food waste is logged by name, shift, and reason (burnt, spoiled, over-prepped), carelessness stops immediately. Restaurants typically recover ₹25,000 to ₹70,000/month.
          </p>
        </div>

        <div class="info-card">
          <div class="info-title">⚡ How Staff Use It</div>
          <div class="steps-container">
            <div class="step-item">
              <div class="step-number">1</div>
              <div>Select the wasted ingredient or prepared dish from a searchable list.</div>
            </div>
            <div class="step-item">
              <div class="step-number">2</div>
              <div>Enter weight or quantity (e.g., 1.5 kg) and tag the shift (Morning / Evening).</div>
            </div>
            <div class="step-item">
              <div class="step-number">3</div>
              <div>Select reason (Burnt / Expired / Preparation Error) and click <strong>Log Waste</strong>.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Food Wastage Tracker</strong></div>
      <div>Page 5 of 7</div>
    </div>
  </div>


  <!-- ================= PAGE 6: CHECKLISTS & AUDITS ================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Module 5 • Kitchen Hygiene & SOPs</div>
      </div>

      <div class="module-hero">
        <span class="module-category">Shift Accountability</span>
        <h2 class="module-title">Daily Kitchen Checklists & Audits</h2>
        <p class="module-summary">
          Replace lost paper checklists with digital opening, prep, and closing checklists. Staff tick tasks on their phones and upload live photo proof for deep cleaning, oil quality, and fridge temperatures.
        </p>
      </div>

      <div class="screenshot-frame">
        <img src="${imgChecklists}" alt="RestoPulse Kitchen Checklists" />
      </div>

      <div class="info-grid">
        <div class="info-card benefit">
          <div class="info-title">💡 Total Peace of Mind for Owners</div>
          <p class="info-text">
            You don't need to stand inside the kitchen all night. Managers and owners receive an audit trail with timestamps and photos proving the kitchen was cleaned, gas valves were closed, and food was stored correctly.
          </p>
        </div>

        <div class="info-card">
          <div class="info-title">⚡ Simple Workflow</div>
          <div class="steps-container">
            <div class="step-item">
              <div class="step-number">1</div>
              <div>Staff open today's checklist on any smartphone or kitchen tablet.</div>
            </div>
            <div class="step-item">
              <div class="step-number">2</div>
              <div>Tick opening/closing checklist rows as duties are completed.</div>
            </div>
            <div class="step-item">
              <div class="step-number">3</div>
              <div>Snap required <strong>photo proof</strong> directly via camera and submit.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Kitchen Checklists & Audits</strong></div>
      <div>Page 6 of 7</div>
    </div>
  </div>


  <!-- ================= PAGE 7: TEAM & SUMMARY ================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Module 6 • Secure Team Permissions</div>
      </div>

      <div class="module-hero">
        <span class="module-category">Role-Based Access Control</span>
        <h2 class="module-title">Staff Management & Security</h2>
        <p class="module-summary">
          Give each staff member the exact right level of access. Kitchen cooks and prep staff log waste and complete checklists without ever seeing sensitive restaurant sales revenue, owner margins, or bank details.
        </p>
      </div>

      <div class="screenshot-frame" style="max-height: 80mm;">
        <img src="${imgTeam}" alt="RestoPulse Team Management" style="max-height: 80mm; object-fit: cover; object-position: top;" />
      </div>

      <div class="cta-card">
        <h3 class="cta-title">Built Specially for Independent & Multi-Outlet Restaurants</h3>
        <p class="cta-desc">
          RestoPulse works seamlessly on mobile phones, tablets, and desktop computers. Zero expensive hardware needed. Set up in under 30 minutes.
        </p>
      </div>

      <div class="benefits-summary">
        <div class="b-box">
          <div class="b-box-num">30-40%</div>
          <div class="b-box-label">Average Food Waste Reduction in Month 1</div>
        </div>
        <div class="b-box">
          <div class="b-box-num">&lt; 5 Mins</div>
          <div class="b-box-label">Daily Time Needed for Kitchen Staff</div>
        </div>
        <div class="b-box">
          <div class="b-box-num">100%</div>
          <div class="b-box-label">Clarity on Take-Home Profit per Dish</div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Team Roles & Overview</strong></div>
      <div>Page 7 of 7</div>
    </div>
  </div>

</body>
</html>`;

  const htmlPath = path.resolve(process.cwd(), 'RestoPulse_Guide_Preview.html');
  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log(`Saved HTML preview: ${htmlPath}`);

  console.log('Launching Chrome to render vector PDF...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  console.log('Printing to PDF...');
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      right: '0mm',
      bottom: '0mm',
      left: '0mm',
    },
  });

  // Also copy to public directory
  fs.copyFileSync(OUTPUT_PDF, PUBLIC_PDF);

  await browser.close();

  const stats = fs.statSync(OUTPUT_PDF);
  console.log(`PDF Generated successfully! Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`File saved at: ${OUTPUT_PDF}`);
  console.log(`Public download at: ${PUBLIC_PDF}`);
}

generatePDF().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
