const { chromium } = require('playwright');
require('dotenv').config();

const rawCookie = process.env.COOKIE;

if (!rawCookie) {
  console.error("[-] COOKIE tidak ditemukan di .env file!");
  process.exit(1);
}

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
  console.error("[-] Gagal parsing COOKIE:", err.message);
  process.exit(1);
}

async function startBot() {
  console.log("\n[+] Memulai bot Orochi Prover...");

  const browser = await chromium.launch({
    headless: true,
    timeout: 60000,
  });
  const context = await browser.newContext();
  await context.addCookies(cookies);

  const page = await context.newPage();

  try {
    await page.goto("https://onprover.orochi.network", { waitUntil: "domcontentloaded" });
    console.log("[+] Halaman dimuat, cek Cloudflare...");

    // Handle Cloudflare checkbox
    try {
      const challenge = await page.$('input[type="checkbox"][name="cf-turnstile-response"]');
      if (challenge) {
        console.log("[+] Ada challenge Cloudflare, klik checkbox...");
        await challenge.click();
        await page.waitForTimeout(4000); // tunggu 4 detik untuk verifikasi
        console.log("[+] Challenge Cloudflare selesai.");
      } else {
        console.log("[+] Tidak ada challenge Cloudflare.");
      }
    } catch (err) {
      console.error("[-] Error handle Cloudflare:", err.message);
    }

    console.log("[+] Mencari tombol PROVER atau STOP PROVING...");

    await page.waitForSelector('button, [role="button"], a', { timeout: 20000 });
    const buttons = await page.$$('button, [role="button"], a');

    let proverButton = null;
    let stopProvingButton = null;

    for (const btn of buttons) {
      await btn.scrollIntoViewIfNeeded();
      const text = (await btn.innerText()).toLowerCase();

      if (text.includes("prover") || text.includes("start proving")) {
        proverButton = btn;
        break;
      } else if (text.includes("stop proving")) {
        stopProvingButton = btn;
      }
    }

    if (proverButton) {
      console.log("[+] Menekan tombol PROVER...");
      await proverButton.click();
    } else if (stopProvingButton) {
      console.log("[+] Sudah dalam mode PROVING, lanjut monitor...");
    } else {
      throw new Error("Tombol PROVER atau STOP PROVING tidak ditemukan.");
    }

    console.log("[+] Menunggu proses proving...");

    await page.waitForSelector('text=Your Proof Logs', { timeout: 60000 });
    console.log("[+] Bagian Proof Logs ditemukan, memonitor...");

    await page.waitForFunction(() => {
      const rows = document.querySelectorAll('table tr');
      return rows.length > 1;
    }, { timeout: 120000 });

    console.log("[+] Proof berhasil! Mengambil data terbaru...");

    const proofRow = await page.$('table tr:nth-child(2)');
    const cells = await proofRow.$$('td');

    if (cells.length < 3) {
      console.log("[-] Struktur tabel tidak sesuai, tidak bisa ambil data proof.");
    } else {
      const latestProof = await cells[0].innerText();
      const createAt = await cells[1].innerText();
      const status = await cells[2].innerText();

      console.log("====== LATEST PROOF ======");
      console.log("Proof ID :", latestProof);
      console.log("Created  :", createAt);
      console.log("Status   :", status);
      console.log("==========================");
    }

    console.log("[+] Membiarkan browser tetap terbuka 24 jam...");
    await new Promise(resolve => setTimeout(resolve, 24 * 60 * 60 * 1000)); // 24 jam

  } catch (err) {
    console.error(`[-] Error terjadi: ${err.message}`);
    console.log("[+] Menutup browser dan restart dalam 5 menit...");
    await browser.close();
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    return startBot(); // restart otomatis
  }

  await browser.close();
}

startBot();
