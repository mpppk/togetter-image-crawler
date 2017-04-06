const co = require('co');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Nightmare = require('nightmare');

const setTimeoutAsync = delay => new Promise(r => setTimeout(r, delay));

const hasMoreButton = (nightmare) => {
    return nightmare.exists('.more_tweet_box a.btn');
};

const clickMoreButton = (nightmare) => {
  return nightmare
    .click('.more_tweet_box a.btn')
    .wait('.pagenation')
};

const clickMoreButtonIfExist = (nightmare) => {
  return co(function *() {
    if(yield hasMoreButton(nightmare)) {
      yield clickMoreButton(nightmare);
    }
  });
};

const getTogetterImageUrls = (togetterUrl) => {
  return co(function *() {
    console.log(`fetching image urls... [${togetterUrl}]`);
    const nightmare = Nightmare();
    yield nightmare.goto(togetterUrl);
    yield clickMoreButtonIfExist(nightmare);
    const urls =
      yield nightmare.evaluate(() => {
        const nodeList = document.querySelectorAll('.list_photo img');
        return Array.prototype.map.call(nodeList, (node) => node.src);
      });
    yield nightmare.end();
    return urls;
  });
};

const getImages = (urls, interval) => {
  return co(function *() {
    for(let i in urls) {
      const url = urls[i];
      const fileName = path.basename(url).split(':')[0];
      console.log(`${+i+1}/${urls.length} ${fileName}`);
      const response = yield axios.get(url, {responseType: 'stream'});
      response.data.pipe(fs.createWriteStream(fileName));
      yield setTimeoutAsync(interval);
    }
  });
};

const getTogetterImages = (togetterUrl, interval) => {
  return co(function *() {
    const urls = yield getTogetterImageUrls(togetterUrl);
    return yield getImages(urls, interval);
  });
};

const getMaxPage = (togetterUrl) => {
  return co(function *() {
    const nightmare = Nightmare();
    yield nightmare.goto(togetterUrl);
    console.log(`fetching max page... [${togetterUrl}]`);
    yield clickMoreButtonIfExist(nightmare);
    const pageLinks =
      yield nightmare.evaluate(() => {
        const nodeList =  document.querySelectorAll('.pagenation a');
        return Array.prototype.map.call(nodeList, (node) => node.textContent);
      });
    yield nightmare.end();
    const pages = pageLinks
      .filter(p => /^[0-9]+$/.test(p))
      .map(Number);
    return Math.max.apply(null, pages);
  });
};

co(function *() {
  const maxPage = yield getMaxPage('https://togetter.com/li/1088229');
  for(let i = 0; i < maxPage; i++) {
    console.log(`page ${i+1}/${maxPage}`);
    yield getTogetterImages('https://togetter.com/li/1088229?page=' + (i+1), 2000);
  }
})
  .then(() => console.log('finished!'), e => console.log(e));