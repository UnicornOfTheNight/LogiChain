/**
 * Petits utilitaires HTTP maison, en remplacement d'Express :
 * lecture du corps JSON et envoi de reponses JSON avec en-tetes de securite
 * de base (equivalent minimal du paquet "helmet").
 */

const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5 Mo, anti-abus

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let tooLarge = false;

    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > MAX_BODY_SIZE) {
        tooLarge = true;
        req.destroy();
      }
    });

    req.on('end', () => {
      if (tooLarge) {
        const err = new Error('PAYLOAD_TROP_VOLUMINEUX');
        err.statusCode = 413;
        return reject(err);
      }
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        const parseErr = new Error('JSON_INVALIDE');
        parseErr.statusCode = 400;
        reject(parseErr);
      }
    });

    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer'
  });
  res.end(body);
}

module.exports = { readJsonBody, sendJson };
