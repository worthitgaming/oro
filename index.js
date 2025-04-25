const puppeteer = require("puppeteer");

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

let isFirstRun = true;

async function startBot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  await page.setCookie(...cookies);

  await page.goto("https://onprover.orochi.network", { waitUntil: "networkidle2" });

  console.log("[+] Halaman dimuat, memeriksa tombol...");

  try {
    await page.waitForSelector("button", { timeout: 10000 });
    const buttons = await page.$$('button');

    for (let btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      const lower = text.toLowerCase();

      if (isFirstRun && lower.includes("start")) {
        console.log(`[+] Menekan tombol Start: ${text}`);
        await btn.click();
        isFirstRun = false;
        break;
      }

      if (!isFirstRun && lower.includes("claim")) {
        console.log(`[+] Menekan tombol Claim: ${text}`);
        await btn.click();
        break;
      }
    }
  } catch (err) {
    console.log("[-] Tidak menemukan tombol yang sesuai, atau error:", err.message);
  }

  await page.waitForTimeout(5000);
  await browser.close();
  console.log("[+] Selesai satu siklus. Akan jalan ulang dalam 1 jam...");
}

// Loop tiap 1 jam
(async () => {
  while (true) {
    try {
      await startBot();
    } catch (err) {
      console.error("[!] Error saat menjalankan bot:", err.message);
    }
    await new Promise(resolve => setTimeout(resolve, 3600000)); // 1 jam
  }
})();
