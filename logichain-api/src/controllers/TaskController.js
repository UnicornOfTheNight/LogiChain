const taskService = require('../services/TaskService');
const { sendJson } = require('../lib/http');

class TaskController {
  async create(ctx, res) {
    const payload = { ...ctx.body, eventId: ctx.params.eventId || ctx.body.eventId };
    const task = await taskService.createTask(payload);
    sendJson(res, 201, task);
  }

  async listByEvent(ctx, res) {
    const { skip, limit } = ctx.query;
    const tasks = await taskService.listByEvent(ctx.params.eventId, {
      skip: Number(skip) || 0,
      limit: Number(limit) || 50
    });
    sendJson(res, 200, tasks);
  }

  // Taches assignees a l'utilisateur authentifie (agent de terrain / transporteur)
  async listMine(ctx, res) {
    const { skip, limit } = ctx.query;
    const tasks = await taskService.listMine(ctx.user.id, { skip: Number(skip) || 0, limit: Number(limit) || 50 });
    sendJson(res, 200, tasks);
  }

  async updateStatus(ctx, res) {
    const { version, status } = ctx.body;
    const task = await taskService.updateStatus(ctx.params.id, version, status);
    sendJson(res, 200, task);
  }
}

module.exports = new TaskController();
