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
    headless: true
  });
  const context = await browser.newContext();
  await context.addCookies(cookies);

  const page = await context.newPage();
  await page.goto("https://onprover.orochi.network", { waitUntil: "domcontentloaded" });

  console.log("[+] Halaman dimuat, mencari tombol PROVER...");

  try {
    await page.waitForSelector('button, [role="button"], a', { timeout: 20000 }); // lebih fleksibel cari tombol
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
  }

  console.log("[+] Selesai klik PROVER. Menutup browser...");
  await page.waitForTimeout(5000); // kasih delay 5 detik biar proses aman
  await browser.close();
  console.log("[+] Bot selesai.");
}

startBot();
