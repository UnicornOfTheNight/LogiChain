const Event = require('../models/Event');
const eventRepository = require('../repositories/EventRepository');

class EventService {
  async createEvent(payload) {
    Event.validate(payload);
    const event = new Event(payload);
    return eventRepository.create(event.toDocument());
  }

  async getEvent(id) {
    const event = await eventRepository.findById(id);
    if (!event) {
      const err = new Error('EVENEMENT_INTROUVABLE');
      err.statusCode = 404;
      throw err;
    }
    return event;
  }

  async listEvents(filters = {}, pagination = {}) {
    return eventRepository.findAll(filters, pagination);
  }

  async updateStatus(id, currentVersion, status) {
    const updated = await eventRepository.updateWithLock(id, currentVersion, { status });
    if (!updated) {
      const err = new Error('CONFLIT_VERSION');
      err.statusCode = 409;
      throw err;
    }
    return updated;
  }

  // Decoupage cartographique des zones : name, type, coordinates ([lng,lat][])
  async addZone(eventId, zonePayload) {
    Event.validateZone(zonePayload);
    const zoneDocument = {
      name: zonePayload.name,
      type: zonePayload.type,
      area: { type: 'Polygon', coordinates: [zonePayload.coordinates] }
    };
    const updated = await eventRepository.addZone(eventId, zoneDocument);
    if (!updated) {
      const err = new Error('EVENEMENT_INTROUVABLE');
      err.statusCode = 404;
      throw err;
    }
    return updated;
  }
}

module.exports = new EventService();
