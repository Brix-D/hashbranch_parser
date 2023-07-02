import puppeteer from 'puppeteer-extra';
import pluginStealth   from 'puppeteer-extra-plugin-stealth'; 
import * as XLSX from 'xlsx/xlsx.mjs';

import * as fs from 'fs';
XLSX.set_fs(fs);


puppeteer.use(pluginStealth());

const URL_TO_PARSE_SITE = 'https://www.crunchbase.com/discover/organization.companies/1896f014f0efb0aa8ff92c4aabecd6da';

const LAUNCH_PUPPETEER_OPTS = {
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
    ],
    // ignoreDefaultArgs: ['--disable-extensions'],
};

const PAGE_PUPPETEER_OPTS = {
    networkIdle2Timeout: 5000,
    waitUntil: 'networkidle2',
    timeout: 3000000,
};

async function getPageContent() {
    try {
        const browser = await puppeteer.launch(LAUNCH_PUPPETEER_OPTS);
        const page = await browser.newPage();
        await page.setViewport({width: 1920, height: 1080, deviceScaleFactor: 1});
        await page.goto(URL_TO_PARSE_SITE, PAGE_PUPPETEER_OPTS);
        // console.log(await page.content());
        await page.screenshot({ path: "image.png", fullPage: true });
        // const items = await page.$$('.css-1w7ir6s .css-xrb38u');
        const items = await page.$$('.body-wrapper grid-row');
        for (const item of items) {
            console.log(await item.evaluate((el) => el.textContent));
        }
        // const companies = await processItems(items);
        await browser.close();

        // saveToFile(companies);
    } catch (error) {
        console.log(error);
    }
}

async function processItems(items) {
    const resultItems = [];
    for (const item of items) {
        const company = await item.$('.css-1ltlzjr');
        const companyText = await company.evaluate((el) => el.textContent);

        const location = await item.$('.css-1g3i5yt');
        const locationText = await location.evaluate((el) => el.textContent);
        const [state, country] = locationText.split(', ');
        const [, stateWithoutEmoji] = state.split(' ');
        const result = {
            companyText,
            country: `${country}, ${stateWithoutEmoji}`,
        };
        resultItems.push(result);
    }
    return resultItems;
}

function saveToFile(companies) {
    const workbook = XLSX.utils.book_new();

    const sheet = XLSX.utils.json_to_sheet([], { header: ['Название', 'Страна, штат'], origin: -1 });

    XLSX.utils.sheet_add_json(sheet, companies, { skipHeader: true, origin: "A2" });

    XLSX.utils.book_append_sheet(workbook, sheet, 'hashbranch companies', true);
    XLSX.writeFile(workbook, './hashbranch_companies.xlsx', {});
}

getPageContent();