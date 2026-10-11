import puppeteer from 'puppeteer-core';
import { SignJWT } from 'jose';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/demo-assets');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Generating auth token for Demo Restaurant...');
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'wasteflow-production-session-secret-key-998877665544332211');
  const token = await new SignJWT({
    userId: '356024dc-7f79-4f2e-bfc2-867aa8e7be7f',
    email: 'adnanshariqmd@gmail.com',
    name: 'Adnan',
    role: 'admin',
    restaurantId: '0e0cad24-b0e4-45ea-8734-c99602d92f34',
    businessName: 'Demo Restaurant'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  console.log('Setting realistic demo overheads via API...');
  await fetch('http://localhost:3000/api/menu-costing/operating-expenses', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `wasteflow_session=${token}`
    },
    body: JSON.stringify({
      mode: 'calculated',
      isEnabled: true,
      monthlySalesRevenue: 1000000,
      expenses: [
        { id: 'exp_1', name: 'Restaurant Rent', amount: 100000, category: 'Rent' },
        { id: 'exp_2', name: 'Kitchen & Service Staff', amount: 70000, category: 'Salaries' },
        { id: 'exp_3', name: 'Electricity & Cooking Gas', amount: 20000, category: 'Utilities' },
        { id: 'exp_4', name: 'Maintenance & Repairs', amount: 10000, category: 'Maintenance' },
      ]
    })
  });

  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1360, height: 860, deviceScaleFactor: 2 });

  await page.setCookie({
    name: 'wasteflow_session',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
  });

  const captures = [
    { url: 'http://localhost:3000/app', filename: '0_operations_hub.png', waitMs: 3500 },
    { url: 'http://localhost:3000/app/checklists', filename: '1_checklists.png', waitMs: 3500 },
    { url: 'http://localhost:3000/app/menu-costing', filename: '2_menu_costing.png', waitMs: 3500 },
    { url: 'http://localhost:3000/app/wastage', filename: '3_wastage.png', waitMs: 3500 },
  ];

  for (const c of captures) {
    console.log(`Navigating to ${c.url}...`);
    await page.goto(c.url, { waitUntil: 'networkidle2' });
    if (c.url === 'http://localhost:3000/app') {
      try {
        await page.waitForSelector('.group, h2', { timeout: 15000 });
      } catch (e) {
        console.log('Timeout waiting for selector on /app');
      }
    }
    await new Promise(r => setTimeout(r, c.waitMs));
    const filePath = path.join(OUTPUT_DIR, c.filename);
    await page.screenshot({ path: filePath });
    console.log(`Saved screenshot: ${filePath}`);
  }

  // Also capture the Overhead & Bills tab
  console.log('Switching to Overhead & Bills tab...');
  await page.goto('http://localhost:3000/app/menu-costing', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text && text.includes('Overhead')) {
      await btn.click();
      await new Promise(r => setTimeout(r, 1500));
      break;
    }
  }
  const opexPath = path.join(OUTPUT_DIR, '2b_overhead.png');
  await page.screenshot({ path: opexPath });
  console.log(`Saved screenshot: ${opexPath}`);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
