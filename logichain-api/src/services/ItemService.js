const Item = require('../models/Item');
const itemRepository = require('../repositories/ItemRepository');
const eventRepository = require('../repositories/EventRepository');
const carbonFootprintService = require('./CarbonFootprintService');
const realtimeHub = require('../lib/realtime');
const { pointInPolygon } = require('../lib/geo');

class ItemService {
  async createItem(payload) {
    Item.validate(payload);
    const item = new Item(payload);
    return itemRepository.create(item.toDocument());
  }

  async getItem(id) {
    const item = await itemRepository.findById(id);
    if (!item) throw this._notFound();
    return item;
  }

  async listItems(eventId, filters = {}, pagination = {}) {
    return itemRepository.findByEvent(eventId, filters, pagination);
  }

  // Scan d'un item par un agent de terrain (mode connecte ou deconnecte)
  async scanItem(qrCode, agentId, action, coordinates, note) {
    const item = await itemRepository.findByQrCode(qrCode);
    if (!item) throw this._notFound();

    const updateFields = {};
    if (Item.ACTION_TO_STATUS[action]) updateFields.status = Item.ACTION_TO_STATUS[action];
    if (coordinates) updateFields.location = { type: 'Point', coordinates };

    const historyEntry = {
      action,
      agentId,
      location: coordinates ? { type: 'Point', coordinates } : undefined,
      note,
      timestamp: new Date()
    };

    return itemRepository.updateWithLock(item._id, item.version, updateFields, historyEntry);
  }

  // Declaration d'anomalie geolocalisee par un agent de terrain
  async declareAnomaly(itemId, currentVersion, agentId, coordinates, note) {
    const updated = await itemRepository.updateWithLock(
      itemId,
      currentVersion,
      { status: 'en_maintenance' },
      { action: 'anomalie', agentId, location: { type: 'Point', coordinates }, note, timestamp: new Date() }
    );

    realtimeHub.publishAlert(String(updated.eventId), {
      type: 'anomalie',
      itemId: String(updated._id),
      label: updated.label,
      note,
      coordinates
    });

    return updated;
  }

  // Tableau de bord d'agregation pour les administrateurs
  async getStockDashboard(eventId) {
    const [stock, carbonFootprintKg, bottlenecks] = await Promise.all([
      itemRepository.stockAggregation(eventId),
      carbonFootprintService.getConsolidatedFootprint(eventId),
      itemRepository.bottleneckDetection(eventId)
    ]);
    return { stock, carbonFootprintKg, bottlenecks };
  }

  // Affecte un equipement a un agent de terrain ou un transporteur
  // (userId = null pour desaffecter). Notifie l'agent via le flux d'alertes.
  async assignToUser(itemId, userId) {
    const updated = await itemRepository.assignToUser(itemId, userId);
    if (!updated) throw this._notFound();

    if (userId) {
      realtimeHub.publishAlert(String(updated.eventId), {
        type: 'equipement_affecte',
        itemId: String(updated._id),
        label: updated.label,
        note: 'Nouvel equipement affecte'
      });
    }

    return updated;
  }

  _notFound() {
    const err = new Error('ITEM_INTROUVABLE');
    err.statusCode = 404;
    return err;
  }

  /**
   * Historique complet des scans/mouvements d'un evenement, avec filtres
   * agent / equipement / type d'action / zone geographique. Le filtre de
   * zone est applique en memoire (point-dans-polygone) apres recuperation,
   * car il porte sur la geometrie GeoJSON des zones de l'evenement plutot
   * que sur un champ indexable directement.
   */
  async getScanHistory(eventId, { agentId, itemId, action, zoneId } = {}) {
    let entries = await itemRepository.scanHistory(eventId, { agentId, itemId, action });

    if (zoneId) {
      const event = await eventRepository.findById(eventId);
      const zone = (event?.zones || []).find((z) => String(z._id) === String(zoneId));
      const polygon = zone?.area?.coordinates?.[0];
      entries = polygon
        ? entries.filter((e) => e.location?.coordinates && pointInPolygon(e.location.coordinates, polygon))
        : [];
    }

    return entries;
  }

  // Historique de tous les scans d'un agent/transporteur (feuille de vie personnelle)
  async getMyScanHistory(agentId, { action } = {}) {
    return itemRepository.scanHistoryForAgent(agentId, { action });
  }

  /**
   * Annule un scan (identifie par action + timestamp exacts) : conserve
   * l'entree d'historique (marquee "cancelled", traçabilite complete) et
   * recalcule le statut de l'item a partir des actions restantes. Aucune
   * version n'est demandee au client : le repository relit et utilise la
   * version courante de l'item (cf. cancelHistoryEntry).
   */
  async cancelScan(itemId, entryTimestamp, entryAction) {
    const result = await itemRepository.cancelHistoryEntry(itemId, entryTimestamp, entryAction);

    if (result.error === 'NOT_FOUND') throw this._notFound();
    if (result.error === 'ENTRY_NOT_FOUND') {
      const err = new Error('SCAN_INTROUVABLE_OU_DEJA_ANNULE');
      err.statusCode = 404;
      throw err;
    }
    if (result.error === 'VERSION_CONFLICT') {
      const err = new Error('CONFLIT_VERSION');
      err.statusCode = 409;
      throw err;
    }

    return result.value;
  }
}

module.exports = new ItemService();
