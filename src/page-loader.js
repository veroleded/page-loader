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
    const classUrl = new URL(url, this.url.origin);

    return (classUrl.href)
      .replace(`${classUrl.protocol}//`, '')
      .replace(/(\W|_)/g, '-')
      .concat(extansion);
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
          console.log(err);
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
      .catch((err) => {
        throw err;
      });
  }

  mkDirForSavingResources(dirPath = path.resolve(this.pathForSaving, this.getName(this.url.href, '_files'))) {
    log('Start to make directory for resources');
    return fs.mkdir(dirPath)
      .then(() => {
        log(`The directory was created as ${dirPath}`);
        return dirPath;
      })
      .catch((err) => {
        throw err;
      });
  }

  saveResources(
    linksArray = this.getResourcesLinks(),
    dirPath = path.resolve(this.pathForSaving, this.getName(this.url.href, '_files')),
  ) {
    const linksForResources = Promise.resolve(linksArray);
    const pathDirForSaving = this.mkDirForSavingResources(dirPath);
    const promises = [linksForResources, pathDirForSaving];

    return Promise.all(promises)
      .then(([resourceslinks, dirForSaving]) => Promise.all(
        resourceslinks.map((link) => {
          const extForLink = path.parse(link).ext;
          const linkParse = path.parse(link);
          const nameDirForSaving = path.parse(dirForSaving).name;
          const linkParseDir = linkParse.dir === '/' ? '' : linkParse.dir;
          const newLink = this.getName((`${linkParseDir}/${linkParse.name}`), extForLink || '.html');
          const newAttr = `${nameDirForSaving}/${newLink}`;
          const pathForSaving = `${dirForSaving}/${newLink}`;
          const correctLink = new URL(link, this.url.origin).href;
          return axios({
            method: 'get',
            url: correctLink,
            responseType: 'stream',
          }).then((response) => fs.writeFile(pathForSaving, response.data)).then(() => log(`${link} saved as ${pathForSaving}`))
            .then(() => [link, newAttr])
            .catch((err) => {
              throw err;
            });
        }),
      )).catch((err) => {
        throw err;
      });
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
        `HTML data has been saved as ${this.pathForSaving}/${name}`,
      )))
      .catch((err) => {
        throw err;
      });
  }
}

export default PageLoader;
