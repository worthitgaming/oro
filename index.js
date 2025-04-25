const { chromium } = require('playwright');
require('dotenv').config();

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
    headless: true,
    timeout: 60000,
  });
  const context = await browser.newContext();
  await context.addCookies(cookies);

  const page = await context.newPage();
  await page.goto("https://onprover.orochi.network", { waitUntil: "domcontentloaded" });

  console.log("[+] Halaman dimuat, mencari tombol PROVER atau STOP PROVING...");

  try {
    await page.waitForSelector('button, [role="button"], a', { timeout: 20000 });
    const buttons = await page.$$('button, [role="button"], a');

    let proverButton = null;
    let stopProvingButton = null;

    for (const btn of buttons) {
      await btn.scrollIntoViewIfNeeded();
      const text = await btn.innerText();
      const lower = text.toLowerCase();

      if (lower.includes("prover")) {
        proverButton = btn;
        break;
      } else if (lower.includes("stop proving")) {
        stopProvingButton = btn;
      }
    }

    if (proverButton) {
      console.log("[+] Menekan tombol PROVER...");
      await proverButton.click();
    } else if (stopProvingButton) {
      console.log("[+] Sudah dalam mode PROVING, lanjut monitor...");
    } else {
      throw new Error("Tombol PROVER dan STOP PROVING tidak ditemukan.");
    }

  } catch (err) {
    console.error("[-] Error selama proving:", err.message);
    await browser.close();
    console.log("[+] Menutup browser, akan restart dalam 5 menit...");
    await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    return startBot(); // restart lagi
  }

  console.log("[+] Menunggu proses Proving selesai...");

  try {
    await page.waitForSelector('text=Your Proof Logs', { timeout: 60000 });
    console.log("[+] Bagian Proof Logs ditemukan, memonitor...");

    await page.waitForFunction(() => {
      const tableRows = document.querySelectorAll('table tr');
      return tableRows.length > 1; // berarti sudah ada data proof baru
    }, { timeout: 120000 });

    console.log("[+] Proof berhasil! Menampilkan data terbaru...");

    // Ambil data LATEST PROOF
    const proofRow = await page.$('table tr:nth-child(2)');
    const cells = await proofRow.$$('td');

    const latestProof = await cells[0].innerText();
    const createAt = await cells[1].innerText();
    const status = await cells[2].innerText();

    console.log("====== LATEST PROOF ======");
    console.log("Proof ID :", latestProof);
    console.log("Created  :", createAt);
    console.log("Status   :", status);
    console.log("==========================");

  } catch (err) {
    console.error("[-] Gagal mengambil proof terbaru:", err.message);
  }

  console.log("[+] Membiarkan browser tetap terbuka 24 jam...");

  await new Promise(resolve => setTimeout(resolve, 24 * 60 * 60 * 1000)); // 24 jam
}

startBot();
