const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // Biar kelihatan kerja nya
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  // Load cookies dari file cookies.json
  const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf-8'));
  await page.setCookie(...cookies);

  // Pergi ke website
  await page.goto('https://onprover.orochi.network', {
    waitUntil: 'networkidle2'
  });

  console.log('[+] Halaman berhasil dibuka dengan cookies.');

  // Tunggu tombol PROVER muncul
  await page.waitForSelector('button', { timeout: 15000 });
  
  // Cari tombol PROVER yang teks nya 'PROVER'
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await page.evaluate(el => el.innerText, button);
    if (text.includes('PROVER')) {
      console.log('[+] Tombol PROVER ketemu, klik sekarang.');
      await button.click();
      break;
    }
  }

  console.log('[+] Klik selesai, tidak melakukan apapun lagi.');

  // Bot diam, atau bisa ditutup browsernya kalau mau
  // await browser.close();
})();
