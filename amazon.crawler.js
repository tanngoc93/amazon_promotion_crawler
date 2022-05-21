const fs = require('fs');
const events = require('events');
const puppeteer = require('puppeteer');

events.EventEmitter.defaultMaxListeners = 0;

(async () => {

  const time = 1000;

  let count = 0;
  let promotions = [];
  let scrollTimes = process.env.SCROLLING_TIMES || 10;

  const browserSetting = {
    defaultViewport: null,
    headless: process.env.HEADLESS == `true` ? true : false,
    args: [ `--start-maximized`, `--user-data-dir=./puppeteer_data` ],
  };

  const browser = await puppeteer.launch(browserSetting);
  const page = await browser.newPage();

  await page.goto(`https://affiliate-program.amazon.com/home/promohub/promocodes`);

  // wait for 180.000ms
  await page.waitForTimeout(time * 30);

  for (let i = 0; i < scrollTimes; i++) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    // wait for 5.000ms
    await page.waitForTimeout(time * 5);
  }

  // wait for 3.000ms
  await page.waitForTimeout(time * 3);

  const displayItems = await page.$$('.promotions-list-table-body > .promo-item-display');

  console.log(`******************************************************`);
  console.log(`We have total : ${ displayItems.length } item(s)      `);
  console.log(`******************************************************`);

  for (count = 0; count < displayItems.length; count++) {

    // wait for 1.000ms
    await page.waitForTimeout(time);

    let element = displayItems[count];

    // wait for 1.000ms
    await page.waitForTimeout(time);

    let promotion =
      await page.evaluate((element) => {
        element.querySelector('input.a-button-input').click();
        return {
          title:         element.querySelector('.a-row .a-link-normal').textContent.replace('\n', ''),
          startTime:     element.querySelector('.a-row .promo-category .a-text-normal').childNodes[1].textContent.replace(' |\n', '').trim(),
          endTime:       element.querySelector('.a-row .promo-category .a-text-normal').childNodes[3].textContent.replace('\n', '').trim(),
          promoCategory: element.querySelectorAll('.a-row .promo-category')[0].textContent.replace('\n', ''),
          linkNormal:    element.querySelector('.a-row .a-link-normal').getAttribute('href'), 
        }
      }, element);

    // wait for 3.000ms
    await page.waitForTimeout(time * 3);

    promotion = await page.evaluate((promotion) => {
      promotion['html']  = document.querySelector('span.a-declarative textarea.ac-ad-code-html').value;
      promotion['link']  = document.querySelector('span.a-declarative textarea.ac-ad-code-link').value;
      promotion['short'] = document.querySelector('span.a-declarative textarea.ac-ad-code-short').value;
      return promotion;
    }, promotion);

    // wait for 1.000ms
    await page.waitForTimeout(time);

    await page.evaluate(() => {
      document.querySelector('header.a-popover-header > button.a-button-close').click();
    });

    promotions.push(promotion);

    /**********************************************************************************************/
    /**********************************************************************************************/
    console.log(`Synchronized item's index : ${ count + 1 } | URL Shortener : ${ promotion.short }`);
    /**********************************************************************************************/
    /**********************************************************************************************/
  };

  // wait for 15.000ms
  await page.waitForTimeout(time * 15); console.log(`\n===== Next step =====\n`);

  for (count = 0; count < promotions.length; count++) {

    let promotion = promotions[count];

    await page.goto(promotion.linkNormal);

    const gridItems = await page.$$('.gridItem');

    if (gridItems.length <= 0)
    {
      promotion['image'] = null;
    }
    else
    {
      let element = gridItems[0];

      const link = await page.evaluate((element) => {
        return element.querySelector('.titleLink').href
      }, element);

      // wait for 1.500ms
      await page.waitForTimeout(time * 1.5);

      await page.goto(link);

      // wait for 1.500ms
      await page.waitForTimeout(time * 1.5);

      await page.evaluate(() => {
        document.querySelector('a[title=Image]').click();
      });

      // wait for 1.500ms
      await page.waitForTimeout(time * 1.5);

      const featuredImage = await page.evaluate(() => {
        document.querySelector(
          'div#amzn-ss-large-image-radio-button > label > input[type=radio]'
        ).click();

        return document.querySelector('textarea.amzn-ss-image-textarea').value;
      });

      promotion['image'] = featuredImage;
    }

    console.log(`Synchronized item's index : ${ count + 1 } | URL Shortener : ${promotion.short}`);
  };

  fs.writeFile('./promotions.json', JSON.stringify(promotions, null, 2), 'utf8',
    function (err) {
      if (err) throw err

      console.log(`******************************************************`);
      console.log(`Saved ${ promotions.length } item(s)                  `);
      console.log(`******************************************************`);
    }
  );

  await browser.close();

})();
