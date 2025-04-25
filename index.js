const { chromium } = require('playwright');

const rawCookie = process.env.COOKIE;

let cookies = [];

try {
  const parts = rawCookie.split(';').map(c => c.trim());
  cookies = parts.map(cookieStr => {
    const [name, ...valParts] = cookieStr.split('=');
    const value = valParts.join('=');

    if (!name || !value) return null;

    return {
      name: name,
      value: value,
      domain: "onprover.orochi.network",
      path: "/"
    };
  }).filter(Boolean);
} catch (err) {
  console.error("Gagal parsing COOKIE:", err.message);
  process.exit(1);
}

async function startBot() {
  const browser = await chromium.launch({
    headless: false, // JANGAN headless, biar kelihatan browser terbuka
    timeout: 60000,
  });
  const context = await browser.newContext();
  await context.addCookies(cookies);

  const page = await context.newPage();
  await page.goto("https://onprover.orochi.network", { waitUntil: "domcontentloaded" });

  console.log("[+] Halaman dimuat, mencari tombol PROVER...");

  try {
    await page.waitForSelector('button, [role="button"], a', { timeout: 20000 });
    const buttons = await page.$$('button, [role="button"], a');

    for (const btn of buttons) {
      await btn.scrollIntoViewIfNeeded();
      const text = await btn.innerText();
      const lower = text.toLowerCase();

      if (lower.includes("prover")) {
        console.log(`[+] Menekan tombol PROVER: ${text}`);
        await btn.click();
        break;
      }
    }
  } catch (err) {
    console.error("[-] Gagal menemukan tombol PROVER:", err.message);
    await browser.close();
    return;
  }

  console.log("[+] Menunggu proses Proving selesai...");

  try {
    // Tunggu proof muncul
    await page.waitForSelector('text=Your Proof Logs', { timeout: 30000 });
    await page.waitForFunction(() => {
      const logTable = document.querySelector('table');
      if (!logTable) return false;
      return logTable.innerText.includes('Success') || logTable.innerText.includes('Completed');
    }, { timeout: 120000 });

    console.log("[+] Proof selesai! Data berhasil dibuat.");
    const latestProof = await page.locator('table tr:nth-child(2)').innerText();
    console.log("[+] Proof Terbaru:", latestProof);

  } catch (err) {
    console.error("[-] Gagal menunggu proof selesai:", err.message);
  }

  console.log("[+] Membiarkan browser tetap terbuka 24 jam...");

  // Biar browser tetap terbuka 24 jam
  await new Promise(resolve => setTimeout(resolve, 24 * 60 * 60 * 1000)); // 24 jam dalam milidetik
}

startBot();
