const { URL } = require('url');
const router = require('./routes');
const { readJsonBody, sendJson } = require('./lib/http');
const errorHandler = require('./middlewares/errorHandler');

// CORS applique a la main (remplace le paquet "cors")
function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

/**
 * Gestionnaire de requetes HTTP natif, exporte independamment du serveur
 * (http ou https) qui l'utilise -> voir server.js pour le choix TLS.
 */
async function requestHandler(req, res) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname === '/health') {
    return sendJson(res, 200, { status: 'ok' });
  }

  const match = router.match(req.method, pathname);
  if (!match) {
    return sendJson(res, 404, { error: 'Route introuvable.' });
  }

  try {
    const body = ['POST', 'PATCH', 'PUT'].includes(req.method) ? await readJsonBody(req) : {};
    const query = Object.fromEntries(url.searchParams.entries());
    const ctx = { params: match.params, body, query, headers: req.headers, req };

    // Chaine de handlers : middlewares (authenticate, authorize...) puis controller.
    // Un middleware ne repond pas lui-meme ; seul le dernier handler ecrit la reponse
    // (sauf flux SSE, qui garde la reponse ouverte volontairement).
    for (const handler of match.handlers) {
      await handler(ctx, res);
      if (res.writableEnded) break;
    }
  } catch (err) {
    errorHandler(err, res);
  }
}

module.exports = requestHandler;
