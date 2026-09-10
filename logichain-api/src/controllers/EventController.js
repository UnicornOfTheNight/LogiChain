const eventService = require('../services/EventService');
const { sendJson } = require('../lib/http');

class EventController {
  async create(ctx, res) {
    const event = await eventService.createEvent(ctx.body);
    sendJson(res, 201, event);
  }

  async getOne(ctx, res) {
    const event = await eventService.getEvent(ctx.params.id);
    sendJson(res, 200, event);
  }

  async list(ctx, res) {
    const { skip, limit } = ctx.query;
    const events = await eventService.listEvents(
      {},
      { skip: Number(skip) || 0, limit: Number(limit) || 50 }
    );
    sendJson(res, 200, events);
  }

  async updateStatus(ctx, res) {
    const { version, status } = ctx.body;
    const updated = await eventService.updateStatus(ctx.params.id, version, status);
    sendJson(res, 200, updated);
  }

  async addZone(ctx, res) {
    const updated = await eventService.addZone(ctx.params.eventId, ctx.body);
    sendJson(res, 201, updated);
  }
}

module.exports = new EventController();
