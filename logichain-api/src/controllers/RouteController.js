const routeService = require('../services/RouteService');
const { sendJson } = require('../lib/http');

class RouteController {
  async create(ctx, res) {
    const payload = { ...ctx.body, eventId: ctx.params.eventId || ctx.body.eventId };
    const route = await routeService.createRoute(payload);
    sendJson(res, 201, route);
  }

  async list(ctx, res) {
    const { skip, limit } = ctx.query;
    const routes = await routeService.listRoutes(ctx.params.eventId, {
      skip: Number(skip) || 0,
      limit: Number(limit) || 50
    });
    sendJson(res, 200, routes);
  }

  // Mon planning de livraison (agent de terrain / transporteur)
  async listMine(ctx, res) {
    const { skip, limit } = ctx.query;
    const routes = await routeService.listMine(ctx.user.id, { skip: Number(skip) || 0, limit: Number(limit) || 50 });
    sendJson(res, 200, routes);
  }

  async validateStop(ctx, res) {
    const route = await routeService.validateStop(ctx.params.id, ctx.params.stopId);
    sendJson(res, 200, route);
  }

  async updateStatus(ctx, res) {
    const { version, status } = ctx.body;
    const route = await routeService.updateStatus(ctx.params.id, version, status);
    sendJson(res, 200, route);
  }
}

module.exports = new RouteController();
