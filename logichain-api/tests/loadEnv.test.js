const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const loadEnv = require('../src/lib/loadEnv');

test('loadEnv : lit les paires KEY=VALUE, ignore commentaires et lignes vides', () => {
  const tmpFile = path.join(os.tmpdir(), `test-env-${Date.now()}.env`);
  fs.writeFileSync(
    tmpFile,
    ['# commentaire', '', 'FOO=bar', 'QUOTED="hello world"', "SINGLE='abc'"].join('\n')
  );

  const key = `TEST_KEY_${Date.now()}`;
  delete process.env.FOO;
  delete process.env.QUOTED;
  delete process.env.SINGLE;

  loadEnv(tmpFile);

  assert.equal(process.env.FOO, 'bar');
  assert.equal(process.env.QUOTED, 'hello world');
  assert.equal(process.env.SINGLE, 'abc');

  fs.unlinkSync(tmpFile);
});

test('loadEnv : ne plante pas si le fichier est absent', () => {
  assert.doesNotThrow(() => loadEnv('/chemin/qui/nexiste/pas.env'));
});

test('loadEnv : ne serase pas une variable deja definie', () => {
  process.env.ALREADY_SET = 'valeur-originale';
  const tmpFile = path.join(os.tmpdir(), `test-env-override-${Date.now()}.env`);
  fs.writeFileSync(tmpFile, 'ALREADY_SET=ecrasee');
  loadEnv(tmpFile);
  assert.equal(process.env.ALREADY_SET, 'valeur-originale');
  fs.unlinkSync(tmpFile);
});
