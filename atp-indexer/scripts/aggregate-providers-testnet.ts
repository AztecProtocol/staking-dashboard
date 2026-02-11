import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { aggregateProvidersFromDir } from './aggregate-providers-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const providersDir = join(__dirname, '../../providers-testnet');
const outputFile = join(__dirname, '../src/api/data/providers.json');

aggregateProvidersFromDir(providersDir, outputFile);

