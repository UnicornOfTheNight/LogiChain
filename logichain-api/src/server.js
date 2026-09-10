require('./lib/loadEnv')();
const http = require('http');
const https = require('https');
const fs = require('fs');
const requestHandler = require('./app');
const { connectDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;

/**
 * Chiffrement des communications (Security by Design) : si TLS_KEY_PATH et
 * TLS_CERT_PATH sont fournis, le serveur ecoute en HTTPS natif (module
 * 'https' de Node.js, aucune dependance). Sinon, HTTP simple pour le
 * developpement local (a placer alors derriere un reverse proxy TLS en prod).
 */
function createServer() {
  if (process.env.TLS_KEY_PATH && process.env.TLS_CERT_PATH) {
    const options = {
      key: fs.readFileSync(process.env.TLS_KEY_PATH),
      cert: fs.readFileSync(process.env.TLS_CERT_PATH)
    };
    console.log('[HTTPS] Certificat charge, demarrage en TLS natif.');
    return https.createServer(options, requestHandler);
  }
  console.log('[HTTP] Aucun certificat fourni (TLS_KEY_PATH/TLS_CERT_PATH) : mode developpement.');
  return http.createServer(requestHandler);
}

async function start() {
  await connectDatabase();
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`[LogiChain API] En ecoute sur le port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Erreur au demarrage du serveur :', err);
  process.exit(1);
});
