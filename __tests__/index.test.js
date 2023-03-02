import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import nock from 'nock';
import PageLoader from '../src/page-loader.js';

nock.disableNetConnect();

const url = 'https://ru.hexlet.io/courses';
let tmpPath = '';
let htmlData = '';
let changedData = '';
let imageData = '';
let scriptData = '';
let applicationData = '';
let resourcesData = [];
let dirForSavingTestedResources = '';
const links = [
  '/assets/professions/nodejs.png',
  'https://ru.hexlet.io/packs/js/runtime.js',
  '/assets/application.css',
  '/courses',
];
const oldNew = [
  ['/assets/professions/nodejs.png', 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-professions-nodejs.png'],
  ['https://ru.hexlet.io/packs/js/runtime.js', 'ru-hexlet-io-courses_files/ru-hexlet-io-packs-js-runtime.js'],
  ['/assets/application.css', 'ru-hexlet-io-courses_files/ru-hexlet-io-assets-application.css'],
  ['/courses', 'ru-hexlet-io-courses_files/ru-hexlet-io-courses.html'],

];

beforeAll(async () => {
  htmlData = await fs.readFile('/Users/veroled/projects/pageLoader/__fixtures__/before.html', 'utf-8');
  changedData = await fs.readFile('/Users/veroled/projects/pageLoader/__fixtures__/after.html', 'utf-8');
  imageData = await fs.readFile('/Users/veroled/projects/pageLoader/__fixtures__/image.png', 'utf-8');
  scriptData = await fs.readFile('/Users/veroled/projects/pageLoader/__fixtures__/script.js', 'utf-8');
  applicationData = await fs.readFile('/Users/veroled/projects/pageLoader/__fixtures__/application.css', 'utf-8');
  resourcesData = [
    { link: '/assets/professions/nodejs.png', data: imageData },
    { link: '/assets/application.css', data: applicationData },
    { link: '/courses', data: htmlData },
    { link: '/packs/js/runtime.js', data: scriptData },
  ];
});

beforeEach(async () => {
  tmpPath = await fs.mkdtemp(path.join(tmpdir(), 'page-loader-'));
  dirForSavingTestedResources = `${tmpPath}/ru-hexlet-io-courses_files`;
  resourcesData.forEach(({ link, data }) => nock('https://ru.hexlet.io').persist().get(link).reply(200, data));
});

afterEach(async () => {
  await fs.rm(tmpPath, { recursive: true });
  nock.cleanAll();
});
describe('No file system or http errors', () => {
  test('getHtml', async () => {
    const actual = await new PageLoader(url).getHtml(url);
    expect(actual).toBe(htmlData);
  });

  test('getResourcesLinks', async () => {
    const actualLocal = await new PageLoader(url).getResourcesLinks(htmlData);
    const expectedLocal = [
      '/assets/professions/nodejs.png',
      'https://ru.hexlet.io/packs/js/runtime.js',
      '/assets/application.css',
      '/courses',
    ];
    const actualAll = await new PageLoader(url, tmpPath).getResourcesLinks(htmlData, false);
    const expectedAll = [
      '/assets/professions/nodejs.png',
      'https://js.stripe.com/v3/',
      'https://ru.hexlet.io/packs/js/runtime.js',
      'https://cdn2.hexlet.io/assets/menu.css',
      '/assets/application.css',
      '/courses',
    ];

    expect(actualLocal).toEqual(expectedLocal);
    expect(actualAll).toEqual(expectedAll);
  });

  test('mkDirForSavingResources', async () => {
    const actual1 = await new PageLoader(url).mkDirForSavingResources(`${tmpPath}/ru-hexlet-io-courses_files`);
    const actual2 = await fs.access(dirForSavingTestedResources);

    expect(actual1).toBe(dirForSavingTestedResources);
    expect(actual2).toBe(undefined);
  });

  test('saveResources', async () => {
    await new PageLoader(url).saveResources(links, `${tmpPath}/ru-hexlet-io-courses_files`);
    const actualImage = await fs.readFile(`${dirForSavingTestedResources}/ru-hexlet-io-assets-professions-nodejs.png`, 'utf-8');
    const actualScript = await fs.readFile(`${dirForSavingTestedResources}/ru-hexlet-io-packs-js-runtime.js`, 'utf-8');
    expect(actualImage).toBe(imageData);
    expect(actualScript).toBe(scriptData);
  });

  test('SaveHtml', async () => {
    const filepath = path.resolve(tmpPath, 'ru-hexlet-io-courses.html');
    await new PageLoader(url, tmpPath).saveHtml(htmlData, oldNew, 'ru-hexlet-io-courses.html', tmpPath);
    const actual1 = await fs.access(filepath);
    const actual2 = await fs.readFile(filepath, 'utf-8');
    expect(actual1).toBe(undefined);
    expect(actual2).toBe(changedData);
  });
});

describe('fs throw error', () => {
  test('ENOENT', async () => {
    const actual = new PageLoader(url, tmpPath).mkDirForSavingResources('/Non-existentDirectory/makingDir');

    await expect(actual)
      .rejects
      .toThrow("ENOENT: no such file or directory, mkdir '/Non-existentDirectory/makingDir'");
  });

  test('EACCES', async () => {
    const actual = new PageLoader(url).saveHtml(htmlData, oldNew, 'ru-hexlet-io-courses.html', tmpPath);
    await fs.chmod(tmpPath, 0o400);

    await expect(actual)
      .rejects
      .toThrow(`EACCES: permission denied, open '${tmpPath}/ru-hexlet-io-courses.html'`);
  });

  test('EEXIST', async () => {
    await fs.mkdir(dirForSavingTestedResources);
    const actual = new PageLoader(url).saveResources(links, dirForSavingTestedResources);
    await expect(actual)
      .rejects
      .toThrow(`EEXIST: file already exists, mkdir '${dirForSavingTestedResources}'`);
  });
});

describe('axios throw error', () => {
  beforeEach(() => nock.cleanAll());

  test.each([301, 404, 500])('networks errors, code %i', async (code) => {
    resourcesData.forEach(({ link }) => {
      nock('https://ru.hexlet.io')
        .persist()
        .get(link)
        .reply(code, null);
    });

    const actualGetResourcesLinks = new PageLoader(url, tmpPath).getResourcesLinks();
    const actualGetHtml = new PageLoader(url).getHtml(url);
    const actualSaveHtml = new PageLoader(url, tmpPath).saveHtml(htmlData);
    await expect(actualGetResourcesLinks)
      .rejects
      .toThrow(`Request failed with status code ${code}`);
    await expect(actualGetHtml)
      .rejects
      .toThrow(`Request failed with status code ${code}`);
    await expect(actualSaveHtml)
      .rejects
      .toThrow(`Request failed with status code ${code}`);
  });
});
