/**
 * Test de charge minimaliste, sans dependance externe (pas d'autocannon/k6).
 * Utilise fetch() et performance.now(), tous deux natifs a Node.js >= 18.
 *
 * Usage :
 *   npm run load-test
 *   LOAD_TEST_PATH=/api/v1/events LOAD_TEST_REQUESTS=1000 LOAD_TEST_CONCURRENCY=50 npm run load-test
 */
require('../src/lib/loadEnv')();

const BASE_URL = process.env.LOAD_TEST_URL || `http://localhost:${process.env.PORT || 3000}`;
const CONCURRENCY = Number(process.env.LOAD_TEST_CONCURRENCY) || 20;
const TOTAL_REQUESTS = Number(process.env.LOAD_TEST_REQUESTS) || 500;
const TARGET_PATH = process.env.LOAD_TEST_PATH || '/health';
const AUTH_TOKEN = process.env.LOAD_TEST_TOKEN; // optionnel : Bearer token pour tester une route protegee

async function fireRequest() {
  const start = performance.now();
  try {
    const headers = AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
    const res = await fetch(`${BASE_URL}${TARGET_PATH}`, { headers });
    await res.text();
    return { ok: res.ok, durationMs: performance.now() - start, status: res.status };
  } catch (err) {
    return { ok: false, durationMs: performance.now() - start, error: err.message };
  }
}

function percentile(sortedArray, p) {
  if (sortedArray.length === 0) return NaN;
  const idx = Math.ceil((p / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, idx)];
}

async function worker(remaining, results) {
  while (remaining.count > 0) {
    remaining.count -= 1;
    results.push(await fireRequest());
  }
}

async function run() {
  console.log(`Test de charge : ${TOTAL_REQUESTS} requetes, concurrence ${CONCURRENCY}`);
  console.log(`Cible : ${BASE_URL}${TARGET_PATH}`);
  console.log('');

  const remaining = { count: TOTAL_REQUESTS };
  const results = [];
  const start = performance.now();

  const workers = Array.from({ length: CONCURRENCY }, () => worker(remaining, results));
  await Promise.all(workers);

  const totalDurationSec = (performance.now() - start) / 1000;
  const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const errors = results.filter((r) => !r.ok);

  console.log('--- Resultats ---');
  console.log(`Requetes totales : ${results.length}`);
  console.log(`Erreurs          : ${errors.length} (${((errors.length / results.length) * 100).toFixed(2)}%)`);
  console.log(`Duree totale     : ${totalDurationSec.toFixed(2)} s`);
  console.log(`Debit            : ${(results.length / totalDurationSec).toFixed(1)} req/s`);
  console.log(`Latence min      : ${durations[0]?.toFixed(1)} ms`);
  console.log(`Latence p50      : ${percentile(durations, 50)?.toFixed(1)} ms`);
  console.log(`Latence p95      : ${percentile(durations, 95)?.toFixed(1)} ms`);
  console.log(`Latence p99      : ${percentile(durations, 99)?.toFixed(1)} ms`);
  console.log(`Latence max      : ${durations[durations.length - 1]?.toFixed(1)} ms`);

  if (errors.length > 0) {
    console.log('');
    console.log("Exemples d'erreurs :", errors.slice(0, 3));
  }
}

run().catch((err) => {
  console.error('Erreur lors du test de charge :', err);
  process.exit(1);
});
