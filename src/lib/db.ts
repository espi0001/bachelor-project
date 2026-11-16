/** 
 * Shared Postgres connection (Supabase) for server-side database queries. 
 */

import 'server-only';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL mangler');

// prepare: false er nødvendigt med Supabases transaction pooler
export const sql = postgres(url, { prepare: false });