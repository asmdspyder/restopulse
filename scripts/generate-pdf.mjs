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
  console.log('Loading updated demo screenshots as base64...');
  const imgHub = getBase64Image('0_operations_hub.png');
  const imgChecklists = getBase64Image('1_checklists.png');
  const imgMenuCosting = getBase64Image('2_menu_costing.png');
  const imgOverhead = getBase64Image('2b_overhead.png');
  const imgWastage = getBase64Image('3_wastage.png');

  console.log('Generating revised sleek HTML presentation template...');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RestoPulse - Restaurant Kitchen Operations & Cost Control</title>
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
      font-size: 10pt;
      line-height: 1.45;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      padding: 16mm 18mm 14mm 18mm;
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
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 2.5mm;
      margin-bottom: 3.5mm;
    }
    .brand-logo {
      display: flex;
      align-items: center;
      gap: 2mm;
    }
    .brand-badge {
      width: 7.5mm;
      height: 7.5mm;
      background: #047857;
      color: #ffffff;
      border-radius: 2mm;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 10pt;
    }
    .brand-name {
      font-size: 12pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand-name span {
      color: #047857;
    }
    .header-tagline {
      font-size: 8pt;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Footer on all pages */
    .footer-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #e2e8f0;
      padding-top: 3mm;
      margin-top: 3mm;
      font-size: 8pt;
      color: #94a3b8;
    }
    .footer-bar strong {
      color: #047857;
    }

    /* ================= COVER PAGE ================= */
    .cover-page {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #022c22 100%);
      color: #ffffff;
      padding: 22mm 20mm 18mm 20mm;
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
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 1.5mm 4mm;
      border-radius: 20mm;
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #a7f3d0;
    }
    .cover-center {
      margin-top: 6mm;
      margin-bottom: 6mm;
    }
    .cover-tagline-chip {
      display: inline-flex;
      align-items: center;
      gap: 1.5mm;
      background: rgba(52, 211, 153, 0.2);
      border: 1px solid rgba(52, 211, 153, 0.4);
      color: #a7f3d0;
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 1.5mm 3.5mm;
      border-radius: 1.5mm;
      margin-bottom: 3.5mm;
    }
    .cover-title {
      font-size: 30pt;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -1px;
      color: #ffffff;
      margin-bottom: 3.5mm;
    }
    .cover-title span {
      color: #34d399;
    }
    .cover-intro {
      font-size: 11pt;
      font-weight: 500;
      color: #d1fae5;
      line-height: 1.45;
      max-width: 165mm;
      margin-bottom: 6mm;
    }

    /* 3 Big Pillars Grid on Cover */
    .cover-pillars {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 3.5mm;
    }
    .pillar-card {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 3mm;
      padding: 4mm 3.5mm;
      backdrop-filter: blur(10px);
    }
    .pillar-number {
      font-size: 8pt;
      font-weight: 900;
      color: #34d399;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1.5mm;
      display: flex;
      align-items: center;
      gap: 1.5mm;
    }
    .pillar-title {
      font-size: 10.5pt;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 1.5mm;
      line-height: 1.25;
    }
    .pillar-desc {
      font-size: 8pt;
      color: #a7f3d0;
      line-height: 1.35;
    }

    .cover-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: 3.5mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #d1fae5;
    }

    /* ================= INNER PAGES LAYOUT ================= */
    .module-hero {
      margin-bottom: 2.5mm;
    }
    .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 1.5mm;
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 1mm 2.5mm;
      border-radius: 1mm;
      margin-bottom: 1mm;
    }
    .priority-badge.p1 {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .priority-badge.p2 {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .priority-badge.p3 {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    .priority-badge.hub {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .module-title {
      font-size: 17pt;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      line-height: 1.2;
    }
    .module-summary {
      font-size: 9.5pt;
      color: #475569;
      margin-top: 1mm;
      line-height: 1.35;
    }

    /* Problem vs Solution Split Bar */
    .problem-solution-bar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3mm;
      margin: 2.5mm 0 3.5mm 0;
    }
    .ps-card {
      border-radius: 2.5mm;
      padding: 2.5mm 3.5mm;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }
    .ps-card.problem {
      background: #fff1f2;
      border: 1px solid #fecdd3;
    }
    .ps-card.solution {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }
    .ps-label {
      font-size: 7.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1mm;
      display: flex;
      align-items: center;
      gap: 1.5mm;
    }
    .problem .ps-label {
      color: #be123c;
    }
    .solution .ps-label {
      color: #15803d;
    }
    .ps-text {
      font-size: 8.5pt;
      color: #1e293b;
      line-height: 1.35;
    }

    /* Screenshot Container */
    .screenshot-frame {
      border-radius: 2.5mm;
      border: 1.5px solid #cbd5e1;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      margin: 2.5mm 0;
      background: #f8fafc;
    }
    .screenshot-frame img {
      width: 100%;
      height: auto;
      display: block;
    }

    /* Bottom Info Split */
    .bottom-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3mm;
      margin-top: 2.5mm;
    }
    .bottom-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 2.5mm;
      padding: 3mm 3.5mm;
    }
    .bottom-card.highlight {
      background: #ecfdf5;
      border-color: #a7f3d0;
    }
    .bottom-card-title {
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 1.5mm;
      display: flex;
      align-items: center;
      gap: 1.5mm;
    }
    .highlight .bottom-card-title {
      color: #065f46;
    }

    /* Step items */
    .step-list {
      display: flex;
      flex-direction: column;
      gap: 1.5mm;
    }
    .step-row {
      display: flex;
      align-items: flex-start;
      gap: 2mm;
      font-size: 8.5pt;
      color: #334155;
      line-height: 1.35;
    }
    .step-num {
      width: 4.5mm;
      height: 4.5mm;
      border-radius: 50%;
      background: #047857;
      color: #ffffff;
      font-size: 6.5pt;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 0.3mm;
    }

    /* Callout badge inside bottom card */
    .key-feature-pill {
      display: inline-flex;
      align-items: center;
      gap: 1mm;
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
      padding: 0.8mm 2.5mm;
      border-radius: 1mm;
      font-size: 7.5pt;
      font-weight: 800;
      margin-bottom: 1.5mm;
    }

    /* ================= FINAL SUMMARY PAGE ================= */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      margin: 3mm 0;
      font-size: 8.5pt;
    }
    .summary-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 2.5mm 3.5mm;
      text-align: left;
      font-weight: 800;
    }
    .summary-table td {
      padding: 2.5mm 3.5mm;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .summary-table tr:nth-child(even) {
      background: #f8fafc;
    }
    .summary-table .prob-col {
      color: #be123c;
      font-weight: 600;
      width: 40%;
    }
    .summary-table .sol-col {
      color: #065f46;
      font-weight: 600;
      width: 40%;
    }
    .summary-table .feat-col {
      font-weight: 800;
      color: #0f172a;
      width: 20%;
    }

    .closing-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: 3mm;
      padding: 5mm 6mm;
      text-align: center;
      margin-top: 3.5mm;
    }
    .closing-title {
      font-size: 14pt;
      font-weight: 900;
      color: #34d399;
      margin-bottom: 1.5mm;
    }
    .closing-desc {
      font-size: 9pt;
      color: #cbd5e1;
      max-width: 145mm;
      margin: 0 auto 3.5mm auto;
      line-height: 1.4;
    }
    .stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 3mm;
      margin-top: 3mm;
    }
    .stat-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 3mm;
      border-radius: 2.5mm;
      text-align: center;
    }
    .stat-number {
      font-size: 16pt;
      font-weight: 900;
      color: #047857;
      margin-bottom: 0.5mm;
    }
    .stat-text {
      font-size: 8pt;
      font-weight: 700;
      color: #334155;
    }
  </style>
</head>
<body>

  <!-- ======================================================== -->
  <!-- PAGE 1: REVISED CRYSTAL-CLEAR COVER PAGE                -->
  <!-- ======================================================== -->
  <div class="page cover-page">
    <div class="cover-top">
      <div class="brand-logo">
        <div class="brand-badge" style="background:#ffffff; color:#047857;">RP</div>
        <div class="brand-name" style="color:#ffffff;">Resto<span>Pulse</span></div>
      </div>
      <div class="cover-badge-pill">Restaurant Operations & Profit Software</div>
    </div>

    <div class="cover-center">
      <div class="cover-tagline-chip">
        ⚡ Built For Restaurant Owners & Kitchen Managers
      </div>

      <h1 class="cover-title">
        The Simple Kitchen App<br />
        That <span>Stops Profit Leaks</span><br />
        In Your Restaurant.
      </h1>

      <p class="cover-intro">
        RestoPulse solves the 3 biggest operational headaches every restaurant owner faces: staff skipping cleaning duties, rising ingredient costs eating your margins, and food getting thrown in the bin.
      </p>

      <!-- The 3 Core Pillars in Clear Priority Order -->
      <div class="cover-pillars">
        <!-- Pillar 1: Checklists -->
        <div class="pillar-card">
          <div class="pillar-number">
            <span>PRIORITY 1</span> • <span>HYGIENE</span>
          </div>
          <div class="pillar-title">Daily Kitchen Checklists & SOPs</div>
          <div class="pillar-desc">
            Staff tick opening/closing tasks with <strong>mandatory live camera photos</strong>. Guaranteed kitchen cleanliness & staff accountability.
          </div>
        </div>

        <!-- Pillar 2: Dish Costing -->
        <div class="pillar-card">
          <div class="pillar-number">
            <span>PRIORITY 2</span> • <span>MARGINS</span>
          </div>
          <div class="pillar-title">Dish Costing & Overheads</div>
          <div class="pillar-desc">
            Know exact ingredient making costs, food margins, and factor in monthly rent & staff to see <strong>true take-home profit</strong> per dish.
          </div>
        </div>

        <!-- Pillar 3: Food Waste -->
        <div class="pillar-card">
          <div class="pillar-number">
            <span>PRIORITY 3</span> • <span>SAVINGS</span>
          </div>
          <div class="pillar-title">Food Wastage Recording</div>
          <div class="pillar-desc">
            Fast 10-second waste logging by shift and reason (burnt, spoiled, over-prepped). Cut kitchen waste by <strong>30% to 40%</strong>.
          </div>
        </div>
      </div>
    </div>

    <div class="cover-bottom">
      <div><strong>Product Walkthrough & Feature Demo Guide</strong></div>
      <div>Works on Any Phone, Tablet or Laptop • Zero Complex Setup</div>
    </div>
  </div>


  <!-- ======================================================== -->
  <!-- PAGE 2: OPERATIONS HUB (MODULE CARDS OVERVIEW)           -->
  <!-- ======================================================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Central Launchpad • Operations Hub</div>
      </div>

      <div class="module-hero">
        <span class="priority-badge hub">Central Command Center</span>
        <h2 class="module-title">Restaurant Operations Hub</h2>
        <p class="module-summary">
          Your kitchen team's daily home screen. All operational modules are accessible in clean, visual cards with real-time status badges and today's progress.
        </p>
      </div>

      <!-- Problem vs Solution -->
      <div class="problem-solution-bar">
        <div class="ps-card problem">
          <span class="ps-label">🔴 The Restaurant Problem</span>
          <p class="ps-text">
            Kitchen staff hate complicated software. If a system takes more than 2 minutes to navigate, chefs stop using it and go back to unorganized paper.
          </p>
        </div>
        <div class="ps-card solution">
          <span class="ps-label">🟢 How RestoPulse Solves It</span>
          <p class="ps-text">
            A clean 1-click launchpad. Staff open their shift checklist or log waste in seconds with zero training required.
          </p>
        </div>
      </div>

      <!-- Screenshot: 0_operations_hub.png -->
      <div class="screenshot-frame">
        <img src="${imgHub}" alt="RestoPulse Operations Hub with Module Cards" />
      </div>

      <!-- Bottom Info Grid -->
      <div class="bottom-info-grid">
        <div class="bottom-card highlight">
          <div class="bottom-card-title">💡 Why Owners Love The Hub</div>
          <p class="ps-text">
            When you open the app, you immediately see today's date, checklist completion % (e.g. 50% completed), recorded wastage, and active dishes without clicking through complex menus.
          </p>
        </div>

        <div class="bottom-card">
          <div class="bottom-card-title">⚡ 3 Quick-Action Modules</div>
          <div class="step-list">
            <div class="step-row">
              <div class="step-num">1</div>
              <div><strong>Daily Opening Checklists:</strong> Station readiness & digital sign-off.</div>
            </div>
            <div class="step-row">
              <div class="step-num">2</div>
              <div><strong>Record Kitchen Wastage:</strong> 10-second food loss tracking.</div>
            </div>
            <div class="step-row">
              <div class="step-num">3</div>
              <div><strong>Dish Costing & Recipes:</strong> Live recipe economics & overheads.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Operations Hub & Module Cards</strong></div>
      <div>Page 2 of 7</div>
    </div>
  </div>


  <!-- ======================================================== -->
  <!-- PAGE 3: PRIORITY 1 — DAILY CHECKLISTS & SOPs             -->
  <!-- ======================================================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Feature #1 • Staff Accountability & SOPs</div>
      </div>

      <div class="module-hero">
        <span class="priority-badge p1">Priority Feature 1</span>
        <h2 class="module-title">Daily Kitchen Checklists with Live Camera Proof</h2>
        <p class="module-summary">
          Ensure opening prep, deep cleaning, oil quality, and gas shut-off are completed properly every shift—with mandatory live photo verification.
        </p>
      </div>

      <!-- Problem vs Solution -->
      <div class="problem-solution-bar">
        <div class="ps-card problem">
          <span class="ps-label">🔴 The Problem Restaurant Owners Face</span>
          <p class="ps-text">
            Staff "pencil-whip" paper checklists—ticking all boxes in 10 seconds without actually cleaning fryers, checking fridge temperatures, or shutting gas valves. Owners stress when away.
          </p>
        </div>
        <div class="ps-card solution">
          <span class="ps-label">🟢 How RestoPulse Solves It</span>
          <p class="ps-text">
            Staff cannot fake tasks. Critical duties require a <strong>live camera photo</strong> taken inside the kitchen. Time-stamped logs hold every staff member 100% accountable.
          </p>
        </div>
      </div>

      <!-- Screenshot: 1_checklists.png -->
      <div class="screenshot-frame">
        <img src="${imgChecklists}" alt="Daily Kitchen Checklists & SOPs" />
      </div>

      <!-- Bottom Info Grid -->
      <div class="bottom-info-grid">
        <div class="bottom-card highlight">
          <div class="key-feature-pill">📸 Live Camera Proof & Accountability</div>
          <div class="bottom-card-title">Real Proof, Not Paper Checkmarks</div>
          <p class="ps-text">
            When staff clean the exhaust, check oil color, or restock stations, they click the camera icon and snap a photo. Photos are tied to the staff member's login with exact timestamps.
          </p>
        </div>

        <div class="bottom-card">
          <div class="bottom-card-title">⚡ How Staff Use It Every Day</div>
          <div class="step-list">
            <div class="step-row">
              <div class="step-num">1</div>
              <div>Staff open today's checklist on any smartphone or tablet.</div>
            </div>
            <div class="step-row">
              <div class="step-num">2</div>
              <div>Tick duties by station (Dining Area, Kitchen, Storage, Bar).</div>
            </div>
            <div class="step-row">
              <div class="step-num">3</div>
              <div>Snap required live camera proof and submit for manager review.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Daily Kitchen Checklists & SOPs</strong></div>
      <div>Page 3 of 7</div>
    </div>
  </div>


  <!-- ======================================================== -->
  <!-- PAGE 4: PRIORITY 2 — DISH COSTING & RECIPES              -->
  <!-- ======================================================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Feature #2 • Recipe Economics & Margin Control</div>
      </div>

      <div class="module-hero">
        <span class="priority-badge p2">Priority Feature 2</span>
        <h2 class="module-title">Dish Costing & Standardized Recipes</h2>
        <p class="module-summary">
          Calculate the exact ingredient making cost and food margin % for every dish on your menu. Plus, store step-by-step cooking SOPs so any chef cooks with identical taste.
        </p>
      </div>

      <!-- Problem vs Solution -->
      <div class="problem-solution-bar">
        <div class="ps-card problem">
          <span class="ps-label">🔴 The Problem Restaurant Owners Face</span>
          <p class="ps-text">
            Raw ingredient prices (paneer, chicken, oil, vegetables) fluctuate constantly. Without portion costing, dishes silently become unprofitable while you keep selling them at old rates.
          </p>
        </div>
        <div class="ps-card solution">
          <span class="ps-label">🟢 How RestoPulse Solves It</span>
          <p class="ps-text">
            You enter raw ingredient purchase rates once. RestoPulse automatically calculates the exact making cost and profit margin for every dish on your menu.
          </p>
        </div>
      </div>

      <!-- Screenshot: 2_menu_costing.png -->
      <div class="screenshot-frame">
        <img src="${imgMenuCosting}" alt="Dish Costing & Recipes" />
      </div>

      <!-- Bottom Info Grid -->
      <div class="bottom-info-grid">
        <div class="bottom-card highlight">
          <div class="key-feature-pill">🍲 Automated Recipe Economics</div>
          <div class="bottom-card-title">Instant Margin Visibility</div>
          <p class="ps-text">
            Every dish card shows: <strong>Selling Price</strong>, <strong>Making Cost</strong>, <strong>Food Margin %</strong> (green/yellow/red benchmark), and step-by-step cooking SOP instructions for chefs.
          </p>
        </div>

        <div class="bottom-card">
          <div class="bottom-card-title">⚡ How It Works in 3 Steps</div>
          <div class="step-list">
            <div class="step-row">
              <div class="step-num">1</div>
              <div>Add Raw Ingredients & purchase rate (e.g. 1kg Paneer @ ₹320).</div>
            </div>
            <div class="step-row">
              <div class="step-num">2</div>
              <div>Build Recipe with portion quantities (e.g. 150g Paneer per dish).</div>
            </div>
            <div class="step-row">
              <div class="step-num">3</div>
              <div>View exact making cost, margin %, and estimated net profit.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Dish Costing & Recipes</strong></div>
      <div>Page 4 of 7</div>
    </div>
  </div>


  <!-- ======================================================== -->
  <!-- PAGE 5: PRIORITY 2 (PART B) — OVERHEADS & BILLS          -->
  <!-- ======================================================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Feature #2 (Cont.) • Real Take-Home Cash</div>
      </div>

      <div class="module-hero">
        <span class="priority-badge p2">Profit Protection</span>
        <h2 class="module-title">Restaurant Overheads & Bills Allocation</h2>
        <p class="module-summary">
          Food cost is only half the story. Factor in your fixed monthly bills (rent, staff salaries, electricity) to calculate your true take-home profit on each plate.
        </p>
      </div>

      <!-- Problem vs Solution -->
      <div class="problem-solution-bar">
        <div class="ps-card problem">
          <span class="ps-label">🔴 The Problem Restaurant Owners Face</span>
          <p class="ps-text">
            A dish that looks profitable on food cost alone (e.g. 60% food margin) might actually lose money once you pay restaurant rent, kitchen helpers, and monthly electricity bills.
          </p>
        </div>
        <div class="ps-card solution">
          <span class="ps-label">🟢 How RestoPulse Solves It</span>
          <p class="ps-text">
            RestoPulse allocates your monthly overhead percentage across every dish. You see your <strong>true take-home profit</strong> per serving after food cost AND running bills.
          </p>
        </div>
      </div>

      <!-- Screenshot: 2b_overhead.png -->
      <div class="screenshot-frame">
        <img src="${imgOverhead}" alt="Restaurant Overheads & Bills" />
      </div>

      <!-- Bottom Info Grid -->
      <div class="bottom-info-grid">
        <div class="bottom-card highlight">
          <div class="key-feature-pill">🏢 Real Take-Home Profit</div>
          <div class="bottom-card-title">Sample ₹240 Dish Breakdown</div>
          <p class="ps-text">
            Customer pays: <strong>₹240</strong> • Food cost: <strong>₹84</strong> • Overhead share (20% for rent/bills): <strong>₹48</strong> • <strong>Real Take-Home Cash: ₹108</strong>. Clean, clear, zero guesswork!
          </p>
        </div>

        <div class="bottom-card">
          <div class="bottom-card-title">⚡ 2 Simple Setup Options</div>
          <div class="step-list">
            <div class="step-row">
              <div class="step-num">A</div>
              <div><strong>Auto-Calculate from Bills:</strong> Enter monthly sales + 1-click bills (Rent, Salaries, Electricity). Rate calculates automatically.</div>
            </div>
            <div class="step-row">
              <div class="step-num">B</div>
              <div><strong>Enter Fixed %:</strong> Directly enter an overhead rate (e.g. 20%) in 5 seconds.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Overheads & Running Bills</strong></div>
      <div>Page 5 of 7</div>
    </div>
  </div>


  <!-- ======================================================== -->
  <!-- PAGE 6: PRIORITY 3 — FOOD WASTAGE TRACKER                -->
  <!-- ======================================================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Feature #3 • Food Loss Prevention</div>
      </div>

      <div class="module-hero">
        <span class="priority-badge p3">Priority Feature 3</span>
        <h2 class="module-title">Daily Food Wastage Tracker</h2>
        <p class="module-summary">
          Stop throwing thousands of rupees into the kitchen trash bin. Give staff a lightning-fast 10-second logger to track wasted food by shift and exact reason.
        </p>
      </div>

      <!-- Problem vs Solution -->
      <div class="problem-solution-bar">
        <div class="ps-card problem">
          <span class="ps-label">🔴 The Problem Restaurant Owners Face</span>
          <p class="ps-text">
            The average dining restaurant loses 5% to 8% of all food purchases to trash (burnt gravies, expired dairy, over-prepped rice). That is ₹30,000 to ₹80,000 thrown away every month.
          </p>
        </div>
        <div class="ps-card solution">
          <span class="ps-label">🟢 How RestoPulse Solves It</span>
          <p class="ps-text">
            When kitchen staff know food waste is logged with their name, shift, and reason, carelessness stops immediately. Waste drops by 30% to 40% in the very first month.
          </p>
        </div>
      </div>

      <!-- Screenshot: 3_wastage.png -->
      <div class="screenshot-frame">
        <img src="${imgWastage}" alt="Daily Food Wastage Tracker" />
      </div>

      <!-- Bottom Info Grid -->
      <div class="bottom-info-grid">
        <div class="bottom-card highlight">
          <div class="key-feature-pill">🗑️ 10-Second Fast Logging</div>
          <div class="bottom-card-title">Instant Rupee Loss Visibility</div>
          <p class="ps-text">
            RestoPulse automatically links wasted items to purchase prices, showing the exact rupee value thrown away. Owners identify top money-losing ingredients and fix the root cause.
          </p>
        </div>

        <div class="bottom-card">
          <div class="bottom-card-title">⚡ How Staff Log in 3 Steps</div>
          <div class="step-list">
            <div class="step-row">
              <div class="step-num">1</div>
              <div>Pick the wasted item from the searchable list (Chicken, Rice, Milk).</div>
            </div>
            <div class="step-row">
              <div class="step-num">2</div>
              <div>Enter weight/quantity (e.g. 1.5 kg) and tag the shift (Morning / Evening).</div>
            </div>
            <div class="step-row">
              <div class="step-num">3</div>
              <div>Select reason (Burnt / Spoiled / Over-prepped) & tap <strong>Log Waste</strong>.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Food Wastage Tracker</strong></div>
      <div>Page 6 of 7</div>
    </div>
  </div>


  <!-- ======================================================== -->
  <!-- PAGE 7: EXECUTIVE SUMMARY & RESTAURANT ROI               -->
  <!-- ======================================================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">
          <div class="brand-badge">RP</div>
          <div class="brand-name">Resto<span>Pulse</span></div>
        </div>
        <div class="header-tagline">Summary • Restaurant Owner ROI</div>
      </div>

      <div class="module-hero">
        <span class="priority-badge hub">Executive Overview</span>
        <h2 class="module-title">How RestoPulse Protects Your Restaurant</h2>
        <p class="module-summary">
          Three powerful modules working together to keep your kitchen clean, consistent, and profitable every single day.
        </p>
      </div>

      <!-- Comprehensive Summary Table -->
      <table class="summary-table">
        <thead>
          <tr>
            <th class="feat-col">Module</th>
            <th class="prob-col">The Daily Kitchen Pain</th>
            <th class="sol-col">How RestoPulse Solves It</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="feat-col">1. Daily Checklists & SOPs</td>
            <td class="prob-col">Staff skip cleaning & hygiene duties; paper checklists are easily faked.</td>
            <td class="sol-col">Digital checklists with <strong>required live camera photos</strong> & time-stamped staff accountability.</td>
          </tr>
          <tr>
            <td class="feat-col">2. Dish Costing & Overheads</td>
            <td class="prob-col">Rising ingredient costs silently wipe out profits without owners realizing.</td>
            <td class="sol-col">Real-time recipe portion costs, food margin %, and monthly bills allocation for true take-home profit.</td>
          </tr>
          <tr>
            <td class="feat-col">3. Food Wastage Tracker</td>
            <td class="prob-col">₹30,000–₹80,000/month lost into the kitchen bin due to spoilage and over-prep.</td>
            <td class="sol-col">Fast 10-second waste logging by shift and reason. Recovers lost profit in the first 30 days.</td>
          </tr>
        </tbody>
      </table>

      <!-- Big Closing Banner -->
      <div class="closing-card">
        <h3 class="closing-title">Zero Hardware Required • Up & Running in 30 Minutes</h3>
        <p class="closing-desc">
          RestoPulse works directly inside any browser on smartphones, kitchen tablets, or desktop computers. Your kitchen staff only need 3 to 5 minutes a day.
        </p>
      </div>

      <!-- 3 Key Metric Stats -->
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-number">30–40%</div>
          <div class="stat-text">Reduction in Food Waste Losses in Month 1</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">&lt; 5 Mins</div>
          <div class="stat-text">Daily Staff Time Required per Shift</div>
        </div>
        <div class="stat-box">
          <div class="stat-number">100%</div>
          <div class="stat-text">Visibility into Real Take-Home Cash per Dish</div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <div>RestoPulse Demo Guide • <strong>Executive Summary & ROI</strong></div>
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
