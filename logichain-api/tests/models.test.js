const { test } = require('node:test');
const assert = require('node:assert/strict');
const Event = require('../src/models/Event');
const Item = require('../src/models/Item');
const Route = require('../src/models/Route');
const Monitoring = require('../src/models/Monitoring');
const Task = require('../src/models/Task');

test('Event.validate : accepte un payload correct', () => {
  assert.doesNotThrow(() =>
    Event.validate({
      name: 'Festival Test',
      type: 'festival',
      startDate: '2026-08-10',
      endDate: '2026-08-13'
    })
  );
});

test('Event.validate : rejette un type inconnu', () => {
  assert.throws(
    () => Event.validate({ name: 'X', type: 'inconnu', startDate: '2026-01-01', endDate: '2026-01-02' }),
    /type doit etre parmi/
  );
});

test('Event.validate : rejette l\'absence de nom', () => {
  assert.throws(
    () => Event.validate({ type: 'festival', startDate: '2026-01-01', endDate: '2026-01-02' }),
    /name est requis/
  );
});

test('Event : toDocument() ne contient que les champs attendus', () => {
  const event = new Event({
    name: 'Festival Test',
    type: 'festival',
    startDate: '2026-08-10',
    endDate: '2026-08-13'
  });
  const doc = event.toDocument();
  assert.equal(doc.status, 'planifie');
  assert.equal(doc.version, 0);
  assert.ok(doc.startDate instanceof Date);
});

test('Event.validateZone : accepte un polygone ferme valide', () => {
  assert.doesNotThrow(() =>
    Event.validateZone({
      name: 'Scene principale',
      type: 'scene',
      coordinates: [
        [1.15, 49.025],
        [1.152, 49.025],
        [1.152, 49.027],
        [1.15, 49.025]
      ]
    })
  );
});

test('Event.validateZone : rejette un polygone non ferme', () => {
  assert.throws(
    () =>
      Event.validateZone({
        name: 'Scene principale',
        type: 'scene',
        coordinates: [
          [1.15, 49.025],
          [1.152, 49.025],
          [1.152, 49.027]
        ]
      }),
    /polygone ferme/
  );
});

test('Event.validateZone : rejette un type de zone inconnu', () => {
  assert.throws(
    () =>
      Event.validateZone({
        name: 'Zone X',
        type: 'inconnu',
        coordinates: [
          [1.15, 49.025],
          [1.152, 49.025],
          [1.152, 49.027],
          [1.15, 49.025]
        ]
      }),
    /type doit etre parmi/
  );
});

test('Item.validate : rejette une categorie invalide', () => {
  assert.throws(
    () => Item.validate({ eventId: '1', label: 'Cable', category: 'inexistant', qrCode: 'QR-1' }),
    /category doit etre parmi/
  );
});

test('Item : location par defaut si non fournie', () => {
  const item = new Item({ eventId: '1', label: 'Cable', category: 'electrique', qrCode: 'QR-1' });
  assert.deepEqual(item.location, { type: 'Point', coordinates: [0, 0] });
});

test('Item.computeStatusFromHistory : prend le dernier statut mappe valide', () => {
  const history = [
    { action: 'creation', timestamp: '2026-01-01T08:00:00Z' },
    { action: 'livraison', timestamp: '2026-01-01T09:00:00Z' },
    { action: 'deplacement', timestamp: '2026-01-01T10:00:00Z' }
  ];
  assert.equal(Item.computeStatusFromHistory(history), 'en_transit');
});

test('Item.computeStatusFromHistory : ignore les entrees annulees', () => {
  const history = [
    { action: 'livraison', timestamp: '2026-01-01T09:00:00Z' },
    { action: 'deplacement', timestamp: '2026-01-01T10:00:00Z', cancelled: true }
  ];
  assert.equal(Item.computeStatusFromHistory(history), 'livre');
});

test('Item.computeStatusFromHistory : "en_stock" par defaut si aucune action mappee', () => {
  assert.equal(Item.computeStatusFromHistory([{ action: 'creation', timestamp: '2026-01-01T08:00:00Z' }]), 'en_stock');
  assert.equal(Item.computeStatusFromHistory([]), 'en_stock');
});

test('Route.validate : exige eventId et transporterId', () => {
  assert.throws(() => Route.validate({}), /eventId est requis/);
});

test('Route.validateStatus : accepte un statut valide', () => {
  assert.doesNotThrow(() => Route.validateStatus('validee'));
});

test('Route.validateStatus : rejette un statut inconnu', () => {
  assert.throws(() => Route.validateStatus('inconnu'), /status doit etre parmi/);
});

test('Monitoring.validate : la value doit etre un nombre', () => {
  assert.throws(
    () => Monitoring.validate({ eventId: '1', metricType: 'carbon_footprint', value: 'pas-un-nombre' }),
    /value doit etre un nombre/
  );
});

test('Monitoring.validate : accepte un payload correct', () => {
  assert.doesNotThrow(() =>
    Monitoring.validate({ eventId: '1', metricType: 'carbon_footprint', value: 42.5 })
  );
});

test('Task.validate : accepte un payload correct', () => {
  assert.doesNotThrow(() =>
    Task.validate({ eventId: '1', assignedToUserId: '2', title: 'Verifier le stock' })
  );
});

test('Task.validate : rejette l\'absence de destinataire', () => {
  assert.throws(() => Task.validate({ eventId: '1', title: 'X' }), /assignedToUserId est requis/);
});

test('Task.validateStatus : accepte un statut valide', () => {
  assert.doesNotThrow(() => Task.validateStatus('en_cours'));
});

test('Task.validateStatus : rejette un statut inconnu', () => {
  assert.throws(() => Task.validateStatus('inconnu'), /status doit etre parmi/);
});

test('Task : toDocument() applique les valeurs par defaut', () => {
  const task = new Task({ eventId: '1', assignedToUserId: '2', title: 'Verifier le stock' });
  const doc = task.toDocument();
  assert.equal(doc.status, 'a_faire');
  assert.equal(doc.version, 0);
  assert.equal(doc.dueAt, null);
});
