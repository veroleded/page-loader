import debug from 'debug';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const log = debug('page-loader');

class PageLoader {
  constructor(url, pathForSaving = process.cwd()) {
    this.url = new URL(url);
    this.pathForSaving = pathForSaving;
  }

  getName(url, extansion) {
    // try {
    const classUrl = new URL(url, this.url.origin);

    return (classUrl.href)
      .replace(`${classUrl.protocol}//`, '')
      .replace(/(\W|_)/g, '-')
      .concat(extansion);
    // } catch (e) {
    //   return url
    //     .replace(/(\W|_)/g, '-')
    //     .concat(extansion);
    // }
  }

  getHtml(url = this.url) {
    return new Promise((resolve, reject) => {
      log(`Start to get ${this.url.href} HTML data`);
      axios.get(url)
        .then((response) => {
          log(`${this.url.href} HTML data received`);
          resolve(response.data);
        })
        .catch((err) => {
          log('Data retrieval error');
          reject(err);
        });
    });
  }

  getResourcesLinks(htmlText = this.getHtml(), onlyLocal = true) {
    const html = Promise.resolve(htmlText);
    const imagelinks = [];
    const otherLinks = [];

    return html.then((htmlData) => {
      log(`Start to get resource Link Array for ${this.url.href}`);
      const $ = cheerio.load(htmlData);

      $('img').each((i, elem) => {
        imagelinks.push(elem.attribs.src);
      });

      $('script').each((i, elem) => {
        if (elem.attribs.src) {
          otherLinks.push(elem.attribs.src);
        }
      });

      $('link').each((i, elem) => {
        otherLinks.push(elem.attribs.href);
      });
      log('Processig links');
      const LocalOtherLinks = otherLinks.filter((link) => {
        const url = new URL(link, this.url.origin);

        return url.origin === this.url.origin;
      });
      log('Links received');
      return onlyLocal ? [...imagelinks, ...LocalOtherLinks] : [...imagelinks, ...otherLinks];
    })
      .catch((err) => console.error(err));
  }

  mkDirForSavingResources(dirPath = path.resolve(this.pathForSaving, this.getName(this.url.href, '_files'))) {
    log('Start to make directory for resources');
    return fs.mkdir(dirPath)
      .then(() => {
        log(`The directory was created as ${dirPath}`);
        return dirPath;
      })
      .catch((err) => console.error(err));
  }

  saveResources(
    linksArray = this.getResourcesLinks(),
    dirPath = path.resolve(this.pathForSaving, this.getName(this.url.href, '_files')),
  ) {
    const linksForResources = Promise.resolve(linksArray);
    const pathForSaving = this.mkDirForSavingResources(dirPath);
    const promises = [linksForResources, pathForSaving];

    return Promise.all(promises)
      .then(([resourceslinks, dirForSaving]) => Promise.all(
        resourceslinks.map((link) => {
          const nameForSaving = dirForSaving.split('/').pop();
          let newLink = link.split('.');
          const extantion = newLink.pop();

          if (extantion.length > 4) {
            newLink = this.getName(newLink.concat(extantion).join('-'), '.html');
          } else {
            newLink = this.getName(newLink.join('-'), `.${extantion}`);
          }

          const src = `${nameForSaving}/${newLink}`;
          const pathForImage = `${dirForSaving}/${newLink}`;
          const correctLink = new URL(link, this.url.origin).href;
          return axios({
            method: 'get',
            url: correctLink,
            responseType: 'stream',
          }).then((response) => fs.writeFile(pathForImage, response.data)).then(() => log(`${link} saved as ${pathForImage}`))
            .then(() => [link, src])
            .catch((err) => console.error(err));
        }),
      )).catch((err) => console.error(err));
  }

  saveHtml(
    htmlText = this.getHtml(),
    oldNewLinksArray = this.saveResources(),
    name = this.getName(this.url.href, '.html'),
    dirForSaving = this.pathForSaving,
  ) {
    const html = Promise.resolve(htmlText);
    const links = Promise.resolve(oldNewLinksArray);
    return Promise.all([html, links])
      .then(([htmlData, oldNew]) => {
        log('Changing HTML data');
        let changedHtml = htmlData;
        oldNew.forEach(([oldLink, newLink]) => {
          changedHtml = changedHtml.replace(oldLink, newLink);
        });
        return changedHtml;
      })
      .then((newHtml) => fs.writeFile(`${dirForSaving}/${name}`, newHtml).then(() => log(
        `HTML data has been saved as ${this.pathForSaving}`,
      )))
      .catch((err) => console.error(err));
  }
}

export default PageLoader;
