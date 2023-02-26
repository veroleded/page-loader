#!/usr/bin/env node

import { program } from 'commander';
import main from '../src/main.js';

program
  .name('page-loader')
  .description('Loader utility')
  .version('1.0.0')
  .argument('<url>', 'url page for loader')
  .option('-o, --output <dir>', 'output dir', process.cwd())
  .action((url) => {
    main(url, program.opts().output);
  });

program.parse(process.argv);
