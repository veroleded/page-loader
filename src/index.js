import axios from 'axios';
import fs from 'fs/promises';
import path from 'node:path';

const getFileName = (url) => {
  const classUrl = new URL(url);

  return (classUrl.href)
    .replace(`${classUrl.protocol}//`, '')
    .replace(/(\W|_)/g, '-')
    .concat('.html');
};

const pageLoader = (url, dirForSaving = process.cwd()) => {
  const fileNameForSaving = getFileName(url);
  const pathForSaving = path.resolve(dirForSaving, fileNameForSaving);
  return new Promise((resolve, reject) => {
    axios.get(url)
      .then((response) => {
        fs.writeFile(pathForSaving, response.data)
          .then(() => resolve(pathForSaving))
          .catch((err) => reject(err));
      })
      .catch((err) => reject(err));
  });
};
// const main = async () => {
//   console.log(await pageLoader('https://ru.hexlet.io/courses'));
// };
// main();

//   return new Promise((resolve) => {
//     axios.get(url)
//       .then((response) => {
//         fsPromises.writeFile(pathForSaving, response.data))
//         .then(() => resolve(pathForSaving))
//       })
//   });
// };
// class PageLoader {
//   constructor(url, dirForSaving = process.cwd()) {
//     this.url = new URL(url);
//     this.dirForSaving = dirForSaving;
//   }

//   getFileName() {
//     return (this.url.href)
//       .replace(`${this.url.protocol}//`, '')
//       .replace(/(\W|_)/g, '-')
//       .concat('.html');
//   }

//   async loadPage(dirForSaving) {
//     const pathForSaving = path.resolve(dirForSaving, this.getFileName());

//     axios.get(this.url)
//       .then((response) => fsPromises.writeFile(pathForSaving, response.data))
//       .catch((error) => console.log(error));

//     return pathForSaving;
//   }
// }

export default pageLoader;
