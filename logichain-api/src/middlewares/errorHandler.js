const { sendJson } = require('../lib/http');

/**
 * Traduit les erreurs metier / techniques en reponses HTTP normalisees,
 * conformement a la contrainte "Architecture REST stricte" (codes de statut
 * fideles au resultat de l'operation).
 */
function errorHandler(err, res) {
  console.error(err);

  if (err.code === 'OPTIMISTIC_LOCK_CONFLICT') {
    return sendJson(res, 409, {
      error: 'Conflit de version : la ressource a ete modifiee entretemps (verrouillage optimiste).',
      code: 'OPTIMISTIC_LOCK_CONFLICT'
    });
  }

  if (err.name === 'ValidationError') {
    return sendJson(res, 422, { error: 'Entite non traitable.', details: err.message });
  }

  if (err.code === 11000) {
    return sendJson(res, 409, { error: 'Ressource en doublon (contrainte unique violee).' });
  }

  const statusCode = err.statusCode || 500;
  sendJson(res, statusCode, { error: err.message || 'Erreur interne du serveur.' });
}

module.exports = errorHandler;
