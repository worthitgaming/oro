// File: index.js
const puppeteer = require("puppeteer");

// Ambil cookie dari environment variable
const rawCookie = process.env.COOKIE;
let cookies;
try {
  cookies = JSON.parse(rawCookie);
} catch (err) {
  console.error("Gagal parsing COOKIE. Pastikan format JSON satu baris valid.");
  process.exit(1);
}

let isFirstRun = true;

async function startBot() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  // Set cookie agar langsung login
  await page.setCookie(...cookies);

  await page.goto("https://onprover.orochi.network", { waitUntil: "networkidle2" });

  console.log("[+] Halaman dimuat, memeriksa tombol...");

  // Klik tombol "Start Proving" jika ini adalah run pertama
  try {
    if (isFirstRun) {
      await page.waitForSelector("button", { timeout: 10000 });
      const buttons = await page.$$('button');
      for (let btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.toLowerCase().includes("start")) {
          console.log(`[+] Menekan tombol Start: ${text}`);
          await btn.click();
          break;
        }
      }
      isFirstRun = false;
    } else {
      // Setelah 24 jam, hanya klik tombol "Claim" jika tersedia
      await page.waitForSelector("button", { timeout: 10000 });
      const buttons = await page.$$('button');
      for (let btn of buttons) {
        const text = await page.evaluate(el => el.innerText, btn);
        if (text.toLowerCase().includes("claim")) {
          console.log(`[+] Menekan tombol Claim: ${text}`);
          await btn.click();
          break;
        }
      }
    }
  } catch (err) {
    console.log("[-] Tidak menemukan tombol yang sesuai, atau error: ", err.message);
  }

  await page.waitForTimeout(5000); // tunggu 5 detik
  await browser.close();
  console.log("[+] Selesai satu siklus. Akan jalan ulang dalam 1 jam...");
}

// Loop selamanya tiap 1 jam
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
