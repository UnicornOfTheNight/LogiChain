/**
 * Fabrique de middleware de controle d'acces base sur le role.
 * Usage : router.post('/x', authenticate, authorize('admin', 'responsable_logistique'), controller.method)
 */
function authorize(...allowedRoles) {
  return function (ctx) {
    if (!ctx.user || !allowedRoles.includes(ctx.user.role)) {
      const err = new Error('ACCES_REFUSE : role insuffisant pour cette operation.');
      err.statusCode = 403;
      throw err;
    }
  };
}

module.exports = authorize;
