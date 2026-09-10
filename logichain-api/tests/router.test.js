const { test } = require('node:test');
const assert = require('node:assert/strict');
const Router = require('../src/lib/Router');

test('Router : correspondance exacte sans parametre', () => {
  const router = new Router();
  router.get('/api/v1/events', () => {});
  const match = router.match('GET', '/api/v1/events');
  assert.ok(match, 'la route aurait du correspondre');
  assert.deepEqual(match.params, {});
});

test('Router : extraction d\'un parametre unique', () => {
  const router = new Router();
  router.get('/api/v1/events/:id', () => {});
  const match = router.match('GET', '/api/v1/events/abc123');
  assert.ok(match);
  assert.deepEqual(match.params, { id: 'abc123' });
});

test('Router : extraction de plusieurs parametres imbriques', () => {
  const router = new Router();
  router.patch('/api/v1/events/:eventId/routes/:id/stops/:stopId/validate', () => {});
  const match = router.match(
    'PATCH',
    '/api/v1/events/evt1/routes/rte1/stops/stp1/validate'
  );
  assert.ok(match);
  assert.deepEqual(match.params, { eventId: 'evt1', id: 'rte1', stopId: 'stp1' });
});

test('Router : la methode HTTP doit correspondre', () => {
  const router = new Router();
  router.get('/api/v1/items/:id', () => {});
  const match = router.match('POST', '/api/v1/items/xyz');
  assert.equal(match, null);
});

test('Router : routes distinctes par methode sur le meme chemin ne se percutent pas', () => {
  const router = new Router();
  router.post('/api/v1/items/scan', () => 'scan');
  router.get('/api/v1/items/:id', () => 'getOne');

  const scanMatch = router.match('POST', '/api/v1/items/scan');
  const getMatch = router.match('GET', '/api/v1/items/scan');

  assert.equal(scanMatch.handlers[0](), 'scan');
  // "scan" est ici interprete comme un :id, ce qui est le comportement attendu en GET
  assert.deepEqual(getMatch.params, { id: 'scan' });
});

test('Router : chemin inconnu renvoie null', () => {
  const router = new Router();
  router.get('/api/v1/events', () => {});
  assert.equal(router.match('GET', '/api/v1/inexistant'), null);
});

test('Router : tolere un slash final', () => {
  const router = new Router();
  router.get('/api/v1/events', () => {});
  const match = router.match('GET', '/api/v1/events/');
  assert.ok(match);
});

test('Router : conserve plusieurs handlers (middlewares + controller) dans l\'ordre', () => {
  const router = new Router();
  const order = [];
  const mw1 = () => order.push('mw1');
  const mw2 = () => order.push('mw2');
  const controller = () => order.push('controller');

  router.post('/api/v1/events', mw1, mw2, controller);
  const match = router.match('POST', '/api/v1/events');

  assert.equal(match.handlers.length, 3);
  match.handlers.forEach((h) => h());
  assert.deepEqual(order, ['mw1', 'mw2', 'controller']);
});
