const puppeteer = require("puppeteer");

// Ambil cookie dari environment variable
const rawCookie = process.env.COOKIE;
let cookies;
try {
  if (rawCookie.trim().startsWith('[')) {
    cookies = JSON.parse(rawCookie);
  } else {
    cookies = JSON.parse(JSON.parse(rawCookie));
  }
} catch (err) {
  console.error("Gagal parsing COOKIE. Pastikan format JSON satu baris valid.");
  console.error("Isi COOKIE yang diterima:", rawCookie);
  process.exit(1);
}

let isFirstRun = true;

async function startBot() {
  console.log(`\n[${new Date().toLocaleString()}] Memulai siklus baru...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    await page.setCookie(...cookies);
    await page.goto("https://onprover.orochi.network", {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    console.log("[+] Halaman dimuat, memeriksa tombol...");

    await page.waitForSelector("button", { timeout: 10000 });
    const buttons = await page.$$('button');

    for (let btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      const lowerText = text.toLowerCase();

      if (isFirstRun && lowerText.includes("start")) {
        console.log(`[+] Menekan tombol Start: ${text}`);
        await btn.click();
        isFirstRun = false;
        break;
      }

      if (!isFirstRun && lowerText.includes("claim")) {
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
