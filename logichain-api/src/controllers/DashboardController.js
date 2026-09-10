const dashboardService = require('../services/DashboardService');
const { sendJson } = require('../lib/http');

class DashboardController {
  async getEventDashboard(ctx, res) {
    const dashboard = await dashboardService.getEventDashboard(ctx.params.eventId);
    sendJson(res, 200, dashboard);
  }
}

module.exports = new DashboardController();
