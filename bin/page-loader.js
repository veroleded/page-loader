#!/usr/bin/env node

import { program } from 'commander';
import pageLoader from '../src/index.js';

program
  .name('page-loader')
  .description('Loader utility')
  .version('1.0.0')
  .argument('<url>', 'url page for loader')
  .option('-o, --output <dir>', 'output dir', '/home/user/current-dir')
  .action((url, dir) => {
    pageLoader(url, dir);
  });

program.parse(process.argv);
