import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';

/**
 * Derive a 32-byte AES-256 key from the ENCRYPTION_SECRET env var.
 * Panics if the env var is not set.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required');
  }
  return createHash('sha256').update(secret).digest();
}

/**
 * Encrypt an API key using AES-256-GCM with a random IV.
 * @returns Object containing the hex-encoded encrypted key and IV
 */
export function encryptKey(key: string): { encryptedKey: string; iv: string } {
  const encKey = getEncryptionKey();
  const iv = randomBytes(16);

  const cipher = createCipheriv('aes-256-gcm', encKey, iv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Append auth tag to encrypted data for integrity verification
  return {
    encryptedKey: encrypted + authTag.toString('hex'),
    iv: iv.toString('hex'),
  };
}

/**
 * Decrypt an API key using AES-256-GCM.
 * @param encryptedKey Hex-encoded encrypted key (with auth tag appended)
 * @param iv Hex-encoded IV used during encryption
 * @returns The original plaintext API key
 */
export function decryptKey(
  encryptedKey: string,
  iv: string
): string {
  const encKey = getEncryptionKey();
  const ivBuffer = Buffer.from(iv, 'hex');

  // The last 16 bytes of encryptedKey are the auth tag
  const encryptedHex = encryptedKey.slice(0, -32);
  const authTagHex = encryptedKey.slice(-32);

  const decipher = createDecipheriv('aes-256-gcm', encKey, ivBuffer);
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
