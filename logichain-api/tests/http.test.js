const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { readJsonBody, sendJson } = require('../src/lib/http');

function fakeRequest(chunks) {
  const req = new EventEmitter();
  req.destroy = () => req.emit('end');
  process.nextTick(() => {
    for (const chunk of chunks) req.emit('data', chunk);
    req.emit('end');
  });
  return req;
}

function fakeResponse() {
  return {
    statusCode: null,
    headers: {},
    body: null,
    writeHead(status, headers) {
      this.statusCode = status;
      this.headers = headers;
    },
    end(body) {
      this.body = body;
    }
  };
}

test('readJsonBody : parse un JSON valide', async () => {
  const req = fakeRequest([Buffer.from('{"qrCode":"QR-1","action":"livraison"}')]);
  const body = await readJsonBody(req);
  assert.deepEqual(body, { qrCode: 'QR-1', action: 'livraison' });
});

test('readJsonBody : corps vide -> objet vide', async () => {
  const req = fakeRequest([]);
  const body = await readJsonBody(req);
  assert.deepEqual(body, {});
});

test('readJsonBody : JSON invalide rejette avec code 400', async () => {
  const req = fakeRequest([Buffer.from('{invalide')]);
  await assert.rejects(readJsonBody(req), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
});

test('sendJson : ecrit le bon statut et le bon corps', () => {
  const res = fakeResponse();
  sendJson(res, 201, { ok: true });
  assert.equal(res.statusCode, 201);
  assert.equal(res.headers['Content-Type'], 'application/json; charset=utf-8');
  assert.equal(res.headers['X-Content-Type-Options'], 'nosniff');
  assert.deepEqual(JSON.parse(res.body), { ok: true });
});
