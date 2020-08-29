const fs = require('fs');
const events = require('events');
const puppeteer = require('puppeteer');

events.EventEmitter.defaultMaxListeners = 0;

let coupons = [];

try {
  coupons = JSON.parse(
    fs.readFileSync('./coupon_dbFull.json')
  );
} catch (err) {
  console.log('Error...', err.message);
}

(async () => {

  const time = 1000;

  let executablePath = null;

  if (process.env.OS == 'linux') {
    executablePath = '/usr/bin/google-chrome';
  } else if (process.env.OS == 'macos') {
    executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  }

  const browserSetting = {
    defaultViewport: null,
    headless: process.env.HEADLESS == 'true' ? true : false,
    args: [
      '--start-maximized'
    ],
    executablePath
  };

  const browser = await puppeteer.launch(browserSetting);
  const page = await browser.newPage();

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

  for (let i = 0; i < coupons.length; i++) {

    let coupon = coupons[i];

    if (coupon.image === null || coupon.image === '') {
      console.log('Nothing...')
    } else {

      await page.goto(
        process.env.DOMAIN || 'https://coupon.thedogpaws.com/admin/coupons/new'
      );

      await page.waitFor(time*1.5);

      await page.waitForSelector('input#coupon_only_in_the_usa');
      await page.click('input#coupon_only_in_the_usa');

      await page.waitForSelector('select#coupon_supplier_id');
      await page.select('select#coupon_supplier_id', '1');

      let $elementHandler = await page.$('select#coupon_product_category_id');
      let properties = await $elementHandler.getProperties();

      for (const property of properties.values()) {
        const element = property.asElement();

        if (element) {
          let hText = await element.getProperty("text");
          let text = await hText.jsonValue();

          if (coupon.promoCategory === text) {
            let hValue = await element.getProperty("value");
            let value = await hValue.jsonValue();
            await page.select('select#coupon_product_category_id', value);
          }
        }
      }

      await page.waitForSelector('select#coupon_affiliate_platform_id');
      await page.select('select#coupon_affiliate_platform_id', '1');

      await page.waitForSelector('input#coupon_name');
      await page.type('input#coupon_name', coupon.title.replace('\n', ''));

      // ******* ******* ******* ******* ******* ******* //
      const code = coupon.title.match(/(?<=code\s+).*?(?=\s+through)/gs)[0];
      // ******* ******* ******* ******* ******* ******* //

      try {          
        // ******* ******* ******* ******* ******* ******* //
        await page.waitForSelector('input#coupon_code');
        // ******* ******* ******* ******* ******* ******* //
        await page.type('input#coupon_code', code.replace(',', ''));
        // ******* ******* ******* ******* ******* ******* //
      } catch (err) {
        console.log('Error...', err.message);
      }

      await page.waitForSelector('input#coupon_short_link');
      await page.type('input#coupon_short_link', coupon.short);

      await page.waitForSelector('input#coupon_link');
      await page.type('input#coupon_link', coupon.link);

      try {
        // ******* ******* ******* // ******* ******* ******* //
        const tags = `${coupon.promoCategory}, ${coupon.title.match(/(?<=from\s+).*?(?=\s+with promo)/gs)[0]}, ${code.replace(',', '')}`
        // ******* ******* ******* // ******* ******* ******* //
        await page.waitForSelector('input#coupon_tag_list');
        // ******* ******* ******* // ******* ******* ******* //
        await page.type('input#coupon_tag_list', tags);
        // ******* ******* ******* // ******* ******* ******* //
      } catch (err) {
        console.log('Error...', err.message);
      }

      await page.waitForSelector('input#coupon_starts_at');
      await page.type('input#coupon_starts_at', coupon.startTime);

      await page.waitForSelector('input#coupon_expires_at');
      await page.type('input#coupon_expires_at', coupon.endTime);

      if (coupon.image !== null && coupon.image !== '') {
        await page.waitForSelector('input#coupon_site_stripe');
        await page.click('input#coupon_site_stripe');

        await page.waitForSelector('textarea#coupon_site_stripe_content');
        await page.type('textarea#coupon_site_stripe_content', coupon.image);
      }

      await page.waitForSelector('textarea#coupon_description');
      await page.type('textarea#coupon_description', coupon.title);

      // ******* ******* ******* // ******* ******* ******* //
      const rate = coupon.title.match(/(?<=Save\s+).*?(?=\s+on select)/gs)[0];
      // ******* ******* ******* // ******* ******* ******* //

      try {
        // ******* ******* ******* // ******* ******* ******* //
        let rateType = 'unknow';
        // ******* ******* ******* // ******* ******* ******* //
        if (rate.includes('$')) {
          rateType = 'cash'
        } else if (rate.includes('%')) {
          rateType = 'percentage'
        }
        // ******* ******* ******* // ******* ******* ******* //
        await page.waitForSelector('select#coupon_discount_rate_type');
        // ******* ******* ******* // ******* ******* ******* //
        await page.type('select#coupon_discount_rate_type', rateType);
        // ******* ******* ******* // ******* ******* ******* //
      } catch (err) {
        console.log('Error...', err.message);
      }

      try {
        // ******* ******* ******* // ******* ******* ******* //
        await page.waitForSelector('input#coupon_discount_rate');
        // ******* ******* ******* // ******* ******* ******* //
        await page.waitFor(time);
        // ******* ******* ******* // ******* ******* ******* //
        await page.type('input#coupon_discount_rate', rate);
        // ******* ******* ******* // ******* ******* ******* //
      } catch (err) {
        console.log('Error...', err.message);
      }

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      await page.waitFor(time*1.5);
      await page.click('li#coupon_submit_action > input[type=submit]');
      await page.waitFor(time*1.5);

      console.log(`Created...${i+1}`);
    }
  }

  await browser.close();

})();
