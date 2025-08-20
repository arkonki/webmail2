/// <reference types="node" />

import { Pool } from 'pg';
import config from '../config';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  (process as any).exit(-1);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
};