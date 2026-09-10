const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('../src/lib/jwt');
const authenticate = require('../src/middlewares/authenticate');
const authorize = require('../src/middlewares/authorize');

const SECRET = 'dev-access-secret-a-changer-en-production'; // valeur par defaut de authenticate.js

test('authenticate : attache ctx.user pour un token valide', () => {
  const token = jwt.sign({ sub: 'user1', role: 'admin', type: 'access' }, SECRET);
  const ctx = { headers: { authorization: `Bearer ${token}` } };
  authenticate(ctx);
  assert.deepEqual(ctx.user, { id: 'user1', role: 'admin' });
});

test('authenticate : rejette une requete sans header Authorization', () => {
  const ctx = { headers: {} };
  assert.throws(() => authenticate(ctx), (err) => {
    assert.equal(err.statusCode, 401);
    return true;
  });
});

test('authenticate : rejette un schema different de Bearer', () => {
  const ctx = { headers: { authorization: 'Basic abc123' } };
  assert.throws(() => authenticate(ctx));
});

test('authenticate : rejette un token de type refresh presente comme access', () => {
  const token = jwt.sign({ sub: 'user1', type: 'refresh' }, SECRET);
  const ctx = { headers: { authorization: `Bearer ${token}` } };
  assert.throws(() => authenticate(ctx));
});

test('authorize : autorise un role present dans la liste', () => {
  const ctx = { user: { id: 'u1', role: 'admin' } };
  assert.doesNotThrow(() => authorize('admin', 'responsable_logistique')(ctx));
});

test('authorize : rejette un role absent de la liste (403)', () => {
  const ctx = { user: { id: 'u1', role: 'agent_terrain' } };
  assert.throws(() => authorize('admin')(ctx), (err) => {
    assert.equal(err.statusCode, 403);
    return true;
  });
});

test('authorize : rejette si ctx.user est absent', () => {
  assert.throws(() => authorize('admin')({}));
});
