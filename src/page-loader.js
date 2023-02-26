import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const getName = (url, extansion) => {
  try {
    const classUrl = new URL(url);

    return (classUrl.href)
      .replace(`${classUrl.protocol}//`, '')
      .replace(/(\W|_)/g, '-')
      .concat(extansion);
  } catch (e) {
    return url
      .replace(/(\W|_)/g, '-')
      .concat(extansion);
  }
};

class PageLoader {
  constructor(url, pathForSaving = process.cwd()) {
    this.url = new URL(url);
    this.pathForSaving = pathForSaving;
    console.log(pathForSaving);
  }

  getHtml(url = this.url) {
    return new Promise((resolve, reject) => {
      axios.get(url)
        .then((response) => resolve(response.data))
        .catch((err) => reject(err));
    });
  }

  getImageLinks() {
    const html = this.getHtml();
    const links = [];
    return html.then((htmlData) => {
      const $ = cheerio.load(htmlData);

      $('img').each((i, elem) => {
        links[i] = elem.attribs.src;
      });
      return links;
    }).catch((err) => console.error(err));
  }

  mkDirForSavingResources() {
    const dirName = getName(this.url.href, '_files');
    const dirPath = path.resolve(this.pathForSaving, dirName);
    console.log(dirPath);
    return fs.mkdir(dirPath)
      .then(() => dirPath)
      .catch((err) => console.error(err));
  }

  saveImage() {
    const linksForImage = this.getImageLinks();
    const pathForSaving = this.mkDirForSavingResources();
    const promises = [linksForImage, pathForSaving];
    return Promise.all(promises)
      .then(([links, dirForSaving]) => Promise.all(
        links.map((link) => {
          const nameForSaving = dirForSaving.split('/').pop();
          let newLink = link.split('.');
          const extantion = newLink.pop();
          newLink = getName(this.url.host + newLink.join('-'), `.${extantion}`);
          const src = `${nameForSaving}/${newLink}`;
          const pathForImage = `${dirForSaving}/${newLink}`;

          return axios({
            method: 'get',
            url: link,
            responseType: 'stream',
          }).then((response) => fs.writeFile(pathForImage, response.data))
            .then(() => [link, src])
            .catch((err) => console.error(err));
        }),
      )).catch((err) => console.error(err));
  }

  saveHtml() {
    const name = getName(this.url.href, '.html');
    const html = this.getHtml();
    const links = this.saveImage();
    return Promise.all([html, links])
      .then(([htmlData, oldNew]) => {
        let changedHtml = htmlData;
        oldNew.forEach(([oldLink, newLink]) => {
          changedHtml = changedHtml.replace(oldLink, newLink);
        });
        return changedHtml;
      })
      .then((newHtml) => fs.writeFile(`${this.pathForSaving}/${name}`, newHtml))
      .catch((err) => console.error(err));
  }
}
// const a = await new PageLoader('https://ru.hexlet.io/courses').SaveHtml();
// console.log(a);
export default PageLoader;
