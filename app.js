const co = require('co');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Nightmare = require('nightmare');

let nightmare = Nightmare();

const setTimeoutAsync = delay => new Promise(r => setTimeout(r, delay));

const getTogetterImages = (togetterUrl, interval) => {
  co(function *() {
    console.log(`fetching... [${togetterUrl}]`);
    const urls = yield nightmare
      .goto(togetterUrl)
      .click('.more_tweet_box a.btn')
      .wait('.pagenation')
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

getTogetterImages('https://togetter.com/li/1088229', 2000);