const { chromium } = require('playwright');
require('dotenv').config();

const rawCookie = process.env.COOKIE;

if (!rawCookie || !rawCookie.includes('=')) {
  console.error("COOKIE tidak valid atau kosong.");
  process.exit(1);
}

const cookies = rawCookie.split(';').map(c => {
  const [name, ...valParts] = c.trim().split('=');
  const value = valParts.join('=');
  if (!name || !value) return null;
  return {
    name,
    value,
    domain: "onprover.orochi.network",
    path: "/"
  };
}).filter(Boolean);

async function startBot() {
  while (true) {
    const browser = await chromium.launch({
      headless: true,
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

      let proverClicked = false;
      for (const btn of buttons) {
        await btn.scrollIntoViewIfNeeded();
        const text = await btn.innerText();
        if (text.toLowerCase().includes("prover")) {
          console.log(`[+] Menekan tombol PROVER: ${text}`);
          await btn.click();
          proverClicked = true;
          break;
        }
      }

      if (!proverClicked) {
        throw new Error("Tombol PROVER tidak ditemukan.");
      }

      console.log("[+] Menunggu proses proving selesai...");
      // Tunggu sampai NEW PROOFS bertambah
      await page.waitForFunction(() => {
        const el = Array.from(document.querySelectorAll('div')).find(d => d.innerText?.includes('NEW PROOFS'));
        if (!el) return false;
        const number = parseInt(el.nextElementSibling?.innerText || '0', 10);
        return number > 0;
      }, { timeout: 10 * 60 * 1000 }); // 10 menit

      console.log("[+] Proving berhasil! NEW PROOFS bertambah.");

      // Coba ambil data proof terbaru kalau tersedia
      try {
        const proofRow = await page.$('table tr:nth-child(2)');
        if (proofRow) {
          const cells = await proofRow.$$('td');
          const latestProof = await cells[0].innerText();
          const createAt = await cells[1].innerText();
          const status = await cells[2].innerText();

          console.log("====== LATEST PROOF ======");
          console.log("Proof ID :", latestProof);
          console.log("Created  :", createAt);
          console.log("Status   :", status);
          console.log("==========================");
        } else {
          console.log("[!] Tidak ada data proof baru di tabel.");
        }
      } catch (err) {
        console.error("[-] Gagal mengambil data proof:", err.message);
      }

    } catch (err) {
      console.error("[-] Error selama proving:", err.message);
    } finally {
      console.log("[+] Menutup browser, akan restart dalam 5 menit...");
      await browser.close();
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // delay 5 menit sebelum restart
    }
  }
}

startBot();
