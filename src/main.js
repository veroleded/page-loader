import PageLoader from './page-loader.js';

const main = (url, dirForSaving) => new PageLoader(url, dirForSaving).saveHtml();
export default main;
// main('https://ru.hexlet.io/courses');
