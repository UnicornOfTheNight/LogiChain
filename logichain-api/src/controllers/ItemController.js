const itemService = require('../services/ItemService');
const { sendJson } = require('../lib/http');

class ItemController {
  async create(ctx, res) {
    // eventId peut venir de l'URL (/events/:eventId/items) ou du corps de la requete
    const payload = { ...ctx.body, eventId: ctx.params.eventId || ctx.body.eventId };
    const item = await itemService.createItem(payload);
    sendJson(res, 201, item);
  }

  async getOne(ctx, res) {
    const item = await itemService.getItem(ctx.params.id);
    sendJson(res, 200, item);
  }

  async list(ctx, res) {
    const { status, assignedTo, skip, limit } = ctx.query;
    const filters = {};
    if (status) filters.status = status;
    if (assignedTo) filters.assignedToUserId = assignedTo;
    const items = await itemService.listItems(ctx.params.eventId, filters, {
      skip: Number(skip) || 0,
      limit: Number(limit) || 50
    });
    sendJson(res, 200, items);
  }

  // Scan QR/Barcode par un agent de terrain. L'identite de l'agent vient du
  // token JWT authentifie (ctx.user.id), jamais du corps de la requete :
  // un client ne doit pas pouvoir usurper l'identite d'un autre agent, et
  // c'est ce qui garantit un historique de scans fiable.
  async scan(ctx, res) {
    const { qrCode, action, coordinates, note } = ctx.body;
    const item = await itemService.scanItem(qrCode, ctx.user.id, action, coordinates, note);
    sendJson(res, 200, item);
  }

  async declareAnomaly(ctx, res) {
    const { version, coordinates, note } = ctx.body;
    const item = await itemService.declareAnomaly(ctx.params.id, version, ctx.user.id, coordinates, note);
    sendJson(res, 200, item);
  }

  // Historique des scans/mouvements de l'evenement, avec filtres (admin)
  async scanHistory(ctx, res) {
    const { agentId, itemId, action, zoneId } = ctx.query;
    const history = await itemService.getScanHistory(ctx.params.eventId, { agentId, itemId, action, zoneId });
    sendJson(res, 200, history);
  }

  // Historique de mes propres scans (agent de terrain / transporteur)
  async myScanHistory(ctx, res) {
    const { action } = ctx.query;
    const history = await itemService.getMyScanHistory(ctx.user.id, { action });
    sendJson(res, 200, history);
  }

  // Annulation d'un scan (identifie par action + timestamp exacts)
  async cancelScan(ctx, res) {
    const { timestamp, action } = ctx.body;
    const item = await itemService.cancelScan(ctx.params.id, timestamp, action);
    sendJson(res, 200, item);
  }

  // Affectation d'un equipement a un agent de terrain / transporteur (admin)
  async assign(ctx, res) {
    const { userId } = ctx.body;
    const item = await itemService.assignToUser(ctx.params.id, userId ?? null);
    sendJson(res, 200, item);
  }
}

module.exports = new ItemController();
