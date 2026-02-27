const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

    // Clear local storage
    await page.evaluate(() => localStorage.clear());

    // Re-visit
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });

    const content = await page.content();
    console.log("HTML CONTENT LENGTH:", content.length);
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    console.log("PAGE TITLE:", await page.title());
    console.log("H1 TAG:", await page.evaluate(() => document.querySelector('h1')?.innerText));
    console.log("ERRORS:", errors);

    await browser.close();
})();
