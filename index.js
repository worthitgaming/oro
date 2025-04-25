const { chromium } = require('playwright'); // pastikan playwright sudah diinstall

(async () => {
  const browser = await chromium.launch({ headless: true }); // headless true
  const context = await browser.newContext({
    cookies: [
      {
        name: '_ga',
        value: 'GA1.1.1386342769.1745285362',
        domain: 'onprover.orochi.network',
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
      },
      {
        name: 'cf_clearance',
        value: 'rs2HXb0ekc0pvT4abdpEXBXxEbBCQzrUFkcpvt.KM5c-1745614133-1.2.1.1-yl6o59vY46E.uzV8UZlqKRDsC78PVyGcTyXBZFTEUnrGbJ0ufh3TwdXvJJFay7ZPPBSPXD7dZSSjUNrp0t4bHq5foRc7pg60RNG1wMJLUhVjO7wCHotndJbnAcfo4KdGjaRYgi9TAC9Or717vhhCuigewQyI26bWpbr1OOmQrKfGEQA25ZGLWGFeVvaWcdFjGZUO6IWmyzgBPUx3IACwvumtsqe9cz.phqyJmVB_YnzwCxmLtLuBRm9ugSOAFGFfBJSxpGNsVx5JV6wFrgKM_BjEu5AL6DAHhCk5t4RmpzFxAx5l3CqytNfjJpESAnNSFh9L9NHR8geNUDIvqlZlLgYqD9dYJCGkm7ELCVmwXWLIYoxXz1f76aPHI.KLoVu',
        domain: 'onprover.orochi.network',
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
      {
        name: 'accessToken',
        value: 'eyJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiMTU3N2ZhODgtYTU1Ni00MzhjLWFkOWQtNDc2YTk2NjEyODVmIiwidXNlcm5hbWUiOiIweDdhNWU0ODE3MzQ2OGE1NzU2ZWY3OGQzZDliMGI4ZGYyMzczMTJjNTciLCJpZCI6IjE4MDc4MiIsImJhblVudGlsIjpudWxsLCJzaWQiOiI1NzA2MTk3NC0xMzRjLTQ5NjktYmVlMi0xZGIyMzAxYTdiMmMiLCJleHAiOjE3NDgyMDYxNzd9.2rSXZXeuNmbtTkcMScpWzQtLU2ogFPYiSmdpxIqm_Rw',
        domain: 'onprover.orochi.network',
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'Lax',
      }
    ]
  });

  const page = await context.newPage();
  await page.goto('https://onprover.orochi.network', { waitUntil: 'domcontentloaded' });

  console.log('Sudah masuk, mencoba klik tombol PROVER...');

  try {
    await page.waitForSelector('button', { timeout: 10000 });
    await page.click('button');
    console.log('Tombol sudah diklik.');
  } catch (e) {
    console.error('Gagal menemukan tombol:', e);
  }

  console.log('Skrip akan tetap jalan...');

  await page.waitForTimeout(600000); // tunggu 10 menit (biar sesi tidak mati cepat)
  await browser.close();
})();
