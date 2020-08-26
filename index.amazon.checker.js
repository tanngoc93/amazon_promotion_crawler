const fs = require('fs');
const events = require('events');
const puppeteer = require('puppeteer');

events.EventEmitter.defaultMaxListeners = 0;

(async () => {

  let removed = 0;
  let num_of_coupons = 999;
 
  const time = 1000;

  const browserSetting = {
    defaultViewport: null,
    headless: false,
    args: [
      '--start-fullscreen'
    ]
  };

  const browser = await puppeteer.launch(browserSetting);

  let page = await browser.newPage(),
      page2 = null,
      page3 = null;

  // ================================================== //
  // ================================================== //

  await page.goto(
    process.env.DOMAIN || 'https://coupon.thedogpaws.com/admin/login'
  );

  await page.waitForSelector('input#admin_user_email')
            .then(async () => {
              await page.type('input#admin_user_email', process.env.ADMIN_USER);
            });

  await page.waitForSelector('input#admin_user_password')
            .then(async () => {
              await page.type('input#admin_user_password', process.env.ADMIN_PASS);
            });

  await page.waitForSelector('li#admin_user_submit_action')
            .then(async () => {
              await page.click('li#admin_user_submit_action input[type="submit"]');
            });      

  await page.goto(
    `https://coupon.thedogpaws.com/admin/coupons?q%5Bsupplier_id_eq%5D=1&q%5Bstatus_equals%5D=1&q%5Bended_before_deadline_eq%5D=false&commit=Filter&order=id_desc&per_page=${num_of_coupons}`
  );

  await page.waitFor(time);

  const coupons = await page.$$('#index_table_coupons tbody tr');

  for (let i = 0; i < coupons.length; i++) {

    const element = coupons[i];

    await page.waitFor(time);

    const object = await page.evaluate((element) => {
      return {
        id: element.querySelector('td.col.col-id').textContent,
        link: element.querySelector('td.col.col-link a').href,
      };
    }, element);

    page2 = page2 || await browser.newPage();

    await page2.goto(object.link);

    const gridItem = await page2.$$('.gridItem');
    const alertElements = await page2.$$('div.a-alert-content span.a-size-large.a-text-bold');

    if (gridItem.length <= 0 || alertElements.length >= 1) {
      page3 = page3 || await browser.newPage();

      await page3.goto(
        `https://coupon.thedogpaws.com/admin/coupons/${parseInt(object.id)}/edit`
      );

      await page3.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await page3.waitForSelector('input#coupon_ended_before_deadline');
      await page3.click('input#coupon_ended_before_deadline');
      await page3.click('li#coupon_submit_action > input[type=submit]');

      removed += 1; console.log(`ID...${object.id} | Found...${alertElements.length} | URL...${object.link}`);
    } else {
      console.log(`ID...${object.id} | Found...${alertElements.length} | URL...${object.link}`);
    }

    await page.waitFor(time);
  }

  console.log(`Removed...${removed}`);

  await browser.close();

})();
