const itemRepository = require('../repositories/ItemRepository');
const monitoringRepository = require('../repositories/MonitoringRepository');

// Facteurs d'emission simplifies (kg CO2e / km / item), par mode de transport
const EMISSION_FACTORS = {
  camion: 0.12,
  utilitaire: 0.08,
  velo_cargo: 0.0
};

class CarbonFootprintService {
  calculateTransportFootprint(distanceKm, transportMode, itemCount = 1) {
    const factor = EMISSION_FACTORS[transportMode] ?? EMISSION_FACTORS.camion;
    return Number((distanceKm * factor * itemCount).toFixed(3));
  }

  // Calcule l'empreinte consolidee de l'evenement et l'archive en serie temporelle
  async getConsolidatedFootprint(eventId) {
    const total = await itemRepository.carbonFootprintAggregation(eventId);
    await monitoringRepository.recordMetric(eventId, 'carbon_footprint', total);
    return total;
  }

  async getFootprintHistory(eventId, sinceHours = 24) {
    const since = new Date(Date.now() - sinceHours * 3600 * 1000);
    return monitoringRepository.history(eventId, 'carbon_footprint', since);
  }
}

module.exports = new CarbonFootprintService();
