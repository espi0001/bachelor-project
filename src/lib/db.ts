/** 
 * Shared Postgres connection (Supabase) for server-side database queries. 
 */

import 'server-only';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Missing DATABASE_URL');

// prepare: false is required with Supabase's transaction pooler.
export const sql = postgres(url, { prepare: false });