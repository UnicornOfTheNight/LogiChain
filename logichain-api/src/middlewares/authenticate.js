const jwt = require('../lib/jwt');

/**
 * Verifie le header "Authorization: Bearer <token>" et attache l'utilisateur
 * decode a ctx.user. Ne renvoie rien : lance une erreur (401) interceptee
 * par le gestionnaire d'erreurs centralise si l'authentification echoue.
 */
function authenticate(ctx) {
  const header = ctx.headers?.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    const err = new Error('AUTHENTIFICATION_REQUISE');
    err.statusCode = 401;
    throw err;
  }

  const secret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-a-changer-en-production';
  const payload = jwt.verify(token, secret);

  if (payload.type !== 'access') {
    const err = new Error('TOKEN_INVALIDE');
    err.statusCode = 401;
    throw err;
  }

  ctx.user = { id: payload.sub, role: payload.role };
}

module.exports = authenticate;
