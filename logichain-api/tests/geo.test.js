const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pointInPolygon } = require('../src/lib/geo');

// Carre : (0,0) -> (10,0) -> (10,10) -> (0,10) -> (0,0)
const square = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0]
];

test('pointInPolygon : point clairement a l\'interieur', () => {
  assert.equal(pointInPolygon([5, 5], square), true);
});

test('pointInPolygon : point clairement a l\'exterieur', () => {
  assert.equal(pointInPolygon([50, 50], square), false);
});

test('pointInPolygon : point negatif hors polygone', () => {
  assert.equal(pointInPolygon([-1, -1], square), false);
});
