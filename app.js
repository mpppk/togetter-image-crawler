const client = require('cheerio-httpcli');
const co = require('co');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const setTimeoutAsync = delay => new Promise(r => setTimeout(r, delay));

const getTogetterImages = togetterUrl => {
  co(function *() {
    const result = yield client.fetch(togetterUrl);
    const $ = result.$;
    const urls = $('.list_photo img')
      .map((i, d) => $(d).attr('src'))
      .get();

    for(let i in urls) {
      const url = urls[i];
      const fileName = path.basename(url).split(':')[0];
      console.log(`${+i+1}/${urls.length} ${fileName}`);
      const response = yield axios.get(url, {responseType: 'stream'});
      response.data.pipe(fs.createWriteStream(fileName));
      yield setTimeoutAsync(1000);
    }
  });
};

getTogetterImages('https://togetter.com/li/1088229');