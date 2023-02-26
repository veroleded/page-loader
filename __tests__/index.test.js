import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import nock from 'nock';
import PageLoader from '../src/page-loader.js';

nock.disableNetConnect();

let tmpPath = '';
let data;
let changeData;
let imageData;
let testedData;
let dirForSavingTestedResources;

beforeAll(async () => {
  data = await fs.readFile('/Users/veroled/projects/pageLoader/__fixtures__/beforeLoadPictures.html', 'utf-8');
  changeData = await fs.readFile('/Users/veroled/projects/pageLoader/__fixtures__/afterLoadPictures.html', 'utf-8');
  imageData = await fs.readFile('/Users/veroled/projects/pageLoader/__fixtures__/image.png', 'utf-8');
});

beforeEach(async () => {
  tmpPath = await fs.mkdtemp(path.join(tmpdir(), 'page-loader-'));
  testedData = new PageLoader('https://ru.hexlet.io/courses', tmpPath);
  dirForSavingTestedResources = `${tmpPath}/ru-hexlet-io-courses_files`;
});

afterEach(async () => {
  await fs.rm(tmpPath, { recursive: true });
});

test('getHtml', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, data);
  const actual = await testedData.getHtml();
  expect(actual).toBe(data);
});

test('getImageLinks', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, data);
  const actual = await testedData.getImageLinks();
  const expected = ['/assets/professions/nodejs.png', '/assets/professions/nodejs2.png'];
  expect(actual).toEqual(expected);
});

test('mkDirForSavingResources', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, data);
  const actual1 = await testedData.mkDirForSavingResources();
  const actual2 = await fs.access(dirForSavingTestedResources);
  expect(actual1).toBe(dirForSavingTestedResources);
  expect(actual2).toBe(undefined);
});

test('saveImage', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .times(2)
    .reply(200, data);
  nock(/localhost:80/)
    .get(/\/assets\/professions\/nodejs\.png/)
    .reply(200, imageData)
    .get(/\/assets\/professions\/nodejs2\.png/)
    .reply(200, imageData);
  await testedData.saveImage();
  const actual1 = await fs.readFile(`${dirForSavingTestedResources}/ru-hexlet-io-assets-professions-nodejs.png`, 'utf-8');
  const actual2 = await fs.readFile(`${dirForSavingTestedResources}/ru-hexlet-io-assets-professions-nodejs2.png`, 'utf-8');
  expect(actual1).toBe(imageData);
  expect(actual2).toBe(imageData);
});

test('Is the correct page with the changed links preserved?', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .times(2)
    .reply(200, data);
  nock(/localhost:80/)
    .get(/\/assets\/professions\/nodejs\.png/)
    .reply(200, imageData)
    .get(/\/assets\/professions\/nodejs2\.png/)
    .reply(200, imageData);
  const filepath = path.resolve(tmpPath, 'ru-hexlet-io-courses.html');
  await testedData.saveHtml();
  const actual1 = await fs.access(filepath);
  const actual2 = await fs.readFile(filepath, 'utf-8');
  expect(actual1).toBe(undefined);
  expect(actual2).toBe(changeData);
});
