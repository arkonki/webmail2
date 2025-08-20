import crypto from 'crypto';
import { config } from '../config';

declare const Buffer: any;

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY = Buffer.from(config.ENCRYPTION_KEY, 'utf-8');

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('hex');
}

export function decrypt(hash: string): string {
  const buffer = Buffer.from(hash, 'hex');
  const iv = buffer.slice(0, IV_LENGTH);
  const authTag = buffer.slice(IV_LENGTH, IV_LENGTH * 2);
  const encrypted = buffer.slice(IV_LENGTH * 2);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}
