const co = require('co');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Nightmare = require('nightmare');

let nightmare = Nightmare();

const setTimeoutAsync = delay => new Promise(r => setTimeout(r, delay));

const clickMoreButton = (nightmare, togetterUrl) => {
  return nightmare
    .goto(togetterUrl)
    .click('.more_tweet_box a.btn')
    .wait('.pagenation')
};

const getTogetterImages = (togetterUrl, interval) => {
  co(function *() {
    console.log(`fetching... [${togetterUrl}]`);
    const urls =
      yield clickMoreButton(nightmare, togetterUrl)
      .evaluate(() => {
        const nodeList =  document.querySelectorAll('.list_photo img');
        return Array.prototype.map.call(nodeList, (node) => node.src);
      });
    yield nightmare.end();

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

const getMaxPage = (togetterUrl) => {
  return co(function *() {
    console.log(`fetching... [${togetterUrl}]`);
    const pageLinks =
      yield clickMoreButton(nightmare, togetterUrl)
      .evaluate(() => {
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

getMaxPage('https://togetter.com/li/1088229')
  .then(page => console.log(page));
// getTogetterImages('https://togetter.com/li/1088229', 2000);
// getTogetterImages('https://togetter.com/li/1088229?page=2', 2000);