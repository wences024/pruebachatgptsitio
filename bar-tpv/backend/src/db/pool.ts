import pg from 'pg';
import { env } from './config/env.js';

export const pool = env.databaseUrl
  ? new pg.Pool({ connectionString: env.databaseUrl })
  : null;
