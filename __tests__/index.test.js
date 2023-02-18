import fs from 'fs/promises';
// import { fileURLToPath } from 'url';
import path from 'path';
import os from 'node:os';
import nock from 'nock';
import pageLoader from '../src/index.js';

nock.disableNetConnect();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const getFixturePath = (fileName) => path.join(__dirname, '..', '__fixtures__', fileName);
// const getFileData = (fileName) => fs.readFile(getFixturePath(fileName), 'utf-8');
let tmpPath = '';
const data = 'asdasdas';
beforeEach(async () => {
  tmpPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  console.log({ tmpPath });
});

test('is file exist?', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, data);
  await pageLoader('https://ru.hexlet.io/courses', tmpPath);
  const actual = await fs.access(path.resolve(tmpPath, 'ru-hexlet-io-courses.html'));
  expect(actual).toBe(undefined);
});

test('data is correct', async () => {
  nock(/ru\.hexlet\.io/)
    .get(/\/courses/)
    .reply(200, data);
  await pageLoader('https://ru.hexlet.io/courses', tmpPath);
  const actual = await fs.readFile(path.resolve(tmpPath, 'ru-hexlet-io-courses.html'), 'utf-8');
  expect(actual).toBe(data);
});

afterEach(async () => {
  await fs.rm(tmpPath, { recursive: true });
});
