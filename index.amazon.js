const fs = require('fs');
const events = require('events');
const puppeteer = require('puppeteer');

events.EventEmitter.defaultMaxListeners = 0;

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
      `--start-maximized`,
      `--user-data-dir=./puppeteer_data`
    ],
    executablePath
  };

  const browser = await puppeteer.launch(browserSetting);
  const page = await browser.newPage();

  // ================================================== //
  // ================================================== //

  await page.goto(`https://affiliate-program.amazon.com/home/promohub/promocodes\?ac-ms-src\=nav\&type\=mpc\&active_date_range\=0\&is_featured_promotions\=0\&start_date_range\=\&link_type\=\&created_days\=\&category\=${process.env.CATEGORY}`); 
  // 
  await page.waitFor(time*120);

  for (var x = 0; x < (process.env.NUM_OF_SCROLL || 0); x++) {
    try {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitFor(time*5);
    } catch(err) {
      console.log('Error...', err.message);
    }
  }

  await page.waitFor(time*1.5);

  // ================================================== //
  // ================================================== //

  let i = 0; let coupons = [];

  const promoItems = await page.$$('.promotions-list-table-body > .promo-item-display');

  console.log(`\nStart with ${promoItems.length} promo items...\n`);

  for (i = 0; i < promoItems.length; i++) {
    await page.waitFor(time);
    let element = promoItems[i];
    await page.waitFor(time);

    let coupon = await page.evaluate((element) => {

      element.querySelector('input.a-button-input').click();

      return {
        title: element.querySelector('.a-row .a-link-normal').textContent.replace('\n', ''),
        startTime: element.querySelector('.a-row .promo-category .a-text-normal').childNodes[1].textContent.replace(' |\n', ''),
        endTime: element.querySelector('.a-row .promo-category .a-text-normal').childNodes[3].textContent.replace('\n', ''),
        promoCategory: element.querySelectorAll('.a-row .promo-category')[0].textContent.replace('\n', ''),
        linkNormal: element.querySelector('.a-row .a-link-normal').getAttribute('href'), 
      }
    }, element);

    await page.waitFor(time*3);

    coupon = await page.evaluate((coupon) => {
      coupon['html'] = document.querySelector('span.a-declarative textarea.ac-ad-code-html').value;
      coupon['link'] = document.querySelector('span.a-declarative textarea.ac-ad-code-link').value;
      coupon['short'] = document.querySelector('span.a-declarative textarea.ac-ad-code-short').value;

      return coupon;
    }, coupon);

    await page.waitFor(time);

    await page.evaluate(() => {
      document.querySelector('header.a-popover-header > button.a-button-close').click();
    });

    coupons.push(coupon);

    console.log(`Synchronized...${i+1} | Shortener...${coupon.short}`);
  };

  // ================================================== //
  fs.writeFile('./coupon_db.json', JSON.stringify(coupons),
    function (err) {
      if (err) {
        throw err
      }

      console.log(`\nSaved...${coupons.length}`);
    }
  );

  // ================================================== //

  // ================================================== //
      await page.waitFor(time*15); console.log(`\n===== Next step =====\n`);
  // ================================================== //

  // ================================================== //

  for (i = 0; i < coupons.length; i++) {
    let coupon = coupons[i];

    await page.goto(coupon.linkNormal);

    const gridItems = await page.$$('.gridItem');

    if (gridItems.length <= 0) {
      coupon['image'] = null;
    } else {
      let element = gridItems[0];

      const link = await page.evaluate((element) => {
        return element.querySelector('.titleLink').href
      }, element);

      await page.waitFor(time*1.5);
      await page.goto(link);
      await page.waitFor(time*1.5);

      await page.evaluate(() => {
        document.querySelector('a[title=Image]').click();
      });

      await page.waitFor(time*1.5);

      const featuredImage = await page.evaluate(() => {
        document.querySelector(
          'div#amzn-ss-large-image-radio-button > label > input[type=radio]'
        ).click();

        return document.querySelector('textarea.amzn-ss-image-textarea').value;
      });

      coupon['image'] = featuredImage;
    }

    console.log(`Synchronized...${i+1} | Shortener...${coupon.short}`);
  };

  // ================================================== //
  // ================================================== //

  // ================================================== //
  fs.writeFile('./coupon_dbFull.json', JSON.stringify(coupons),
    function (err) {
      if (err) {
        throw err
      }

      console.log(`\nSaved...${coupons.length}\n`);
    }
  );
  // ================================================== //

  await browser.close();

})();
