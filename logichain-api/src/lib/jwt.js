/**
 * Implementation JWT (HS256) minimaliste en JavaScript natif, en remplacement
 * du paquet "jsonwebtoken". Utilise uniquement le module 'crypto' integre a
 * Node.js (HMAC-SHA256 + comparaison a temps constant).
 */
const crypto = require('crypto');

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

function sign(payload, secret, expiresInSeconds = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verify(token, secret) {
  if (typeof token !== 'string') throw invalidToken();
  const parts = token.split('.');
  if (parts.length !== 3) throw invalidToken();
  const [encodedHeader, encodedPayload, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    throw invalidToken();
  }

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(encodedPayload));
  } catch {
    throw invalidToken();
  }

  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    throw expiredToken();
  }

  return payload;
}

function invalidToken() {
  const err = new Error('TOKEN_INVALIDE');
  err.statusCode = 401;
  return err;
}

function expiredToken() {
  const err = new Error('TOKEN_EXPIRE');
  err.statusCode = 401;
  return err;
}

module.exports = { sign, verify };
