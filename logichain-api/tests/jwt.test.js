const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('../src/lib/jwt');

test('jwt : sign puis verify redonne le payload original', () => {
  const token = jwt.sign({ sub: 'user1', role: 'admin', type: 'access' }, 'secret-test');
  const decoded = jwt.verify(token, 'secret-test');
  assert.equal(decoded.sub, 'user1');
  assert.equal(decoded.role, 'admin');
  assert.ok(decoded.iat);
  assert.ok(decoded.exp);
});

test('jwt : rejette une signature falsifiee', () => {
  const token = jwt.sign({ sub: 'user1' }, 'secret-test');
  const parts = token.split('.');
  const tampered = `${parts[0]}.${parts[1]}.signatureFalsifiee`;
  assert.throws(() => jwt.verify(tampered, 'secret-test'), (err) => {
    assert.equal(err.statusCode, 401);
    return true;
  });
});

test('jwt : rejette un secret different', () => {
  const token = jwt.sign({ sub: 'user1' }, 'secret-a');
  assert.throws(() => jwt.verify(token, 'secret-b'));
});

test('jwt : rejette un token expire', () => {
  const token = jwt.sign({ sub: 'user1' }, 'secret-test', -10); // deja expire
  assert.throws(() => jwt.verify(token, 'secret-test'), (err) => {
    assert.equal(err.message, 'TOKEN_EXPIRE');
    return true;
  });
});

test('jwt : rejette un token malforme', () => {
  assert.throws(() => jwt.verify('pas.un.jwt.valide.du.tout', 'secret-test'));
  assert.throws(() => jwt.verify('', 'secret-test'));
});
