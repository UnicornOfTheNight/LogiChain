const itemService = require('./ItemService');
const eventRepository = require('../repositories/EventRepository');

class DashboardService {
  async getEventDashboard(eventId) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      const err = new Error('EVENEMENT_INTROUVABLE');
      err.statusCode = 404;
      throw err;
    }
    const stockKpis = await itemService.getStockDashboard(eventId);
    return {
      event: { id: event._id, name: event.name, status: event.status },
      ...stockKpis
    };
  }
}

module.exports = new DashboardService();
