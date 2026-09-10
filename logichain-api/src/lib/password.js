/**
 * Hachage de mot de passe avec scrypt (module 'crypto' natif de Node.js),
 * en remplacement du paquet "bcrypt". scrypt est resistant au brute-force
 * materiel (memory-hard), au meme titre que bcrypt/argon2.
 */
const crypto = require('crypto');

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  const keyBuffer = Buffer.from(key, 'hex');
  return keyBuffer.length === derivedKey.length && crypto.timingSafeEqual(keyBuffer, derivedKey);
}

module.exports = { hashPassword, verifyPassword };
