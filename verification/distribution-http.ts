import { after, before } from 'node:test';
import { start, stop } from './distribution-fixtures.ts';
import './distribution-settings.ts';
import './distribution-stock.ts';
import './distribution-warnings.ts';
import './distribution-forecast.ts';
import './distribution-lifecycle.ts';

before(start);
after(stop);
