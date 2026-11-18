/**
 * Encrypts and decrypts secrets (e.g. a store's Shopify Client secret) before they are stored in the database.
 */

import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM: encrypts and detects if the stored text has been changed.
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
// Prefix lets us change algorithm or key later and still read old values.
const VERSION = 'v1';

function getKey(): Buffer {
  const raw = process.env.SHOPIFY_SECRET_KEY;
  if (!raw) {
    throw new Error('Missing SHOPIFY_SECRET_KEY. Generate one with: openssl rand -base64 32');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('SHOPIFY_SECRET_KEY must be 32 bytes, base64-encoded.');
  }
  return key;
}

/** Returns "v1:iv:authTag:ciphertext" (base64 parts). A new random IV is used every time. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, tag, ciphertext].map((part) => (typeof part === 'string' ? part : part.toString('base64'))).join(':');
}

/** Reverses encrypt(). Throws if the key is wrong or the value has been changed. */
export function decrypt(payload: string): string {
  const [version, iv, tag, ciphertext] = payload.split(':');
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error('Unknown encrypted value format.');
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64')), decipher.final()]).toString('utf8');
}
