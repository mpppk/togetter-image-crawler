const client = require('cheerio-httpcli');

client.fetch('https://togetter.com/li/1088229')
  .then(result => {
    const $ = result.$;
    const list = $('.list_photo img')
      .map((i, d) => $(d).attr('src'))
      .get();
    console.log(list);
  });
git