const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../src/lib/password');

test('password : verifyPassword accepte le bon mot de passe', () => {
  const hash = hashPassword('SuperMotDePasse123');
  assert.ok(verifyPassword('SuperMotDePasse123', hash));
});

test('password : verifyPassword rejette un mauvais mot de passe', () => {
  const hash = hashPassword('SuperMotDePasse123');
  assert.equal(verifyPassword('MauvaisMotDePasse', hash), false);
});

test('password : deux hachages du meme mot de passe sont differents (sel aleatoire)', () => {
  const hash1 = hashPassword('MotDePasse');
  const hash2 = hashPassword('MotDePasse');
  assert.notEqual(hash1, hash2);
  assert.ok(verifyPassword('MotDePasse', hash1));
  assert.ok(verifyPassword('MotDePasse', hash2));
});

test('password : verifyPassword gere un hash malforme sans planter', () => {
  assert.equal(verifyPassword('x', 'pas-un-hash-valide'), false);
});
