class Monitoring {
  static METRIC_TYPES = ['carbon_footprint', 'stock_level', 'active_agents'];

  constructor({ eventId, metricType, value, timestamp = new Date() }) {
    this.eventId = eventId;
    this.metricType = metricType;
    this.value = value;
    this.timestamp = timestamp;
  }

  static validate(data) {
    const errors = [];
    if (!data.eventId) errors.push('eventId est requis');
    if (!Monitoring.METRIC_TYPES.includes(data.metricType)) {
      errors.push(`metricType doit etre parmi ${Monitoring.METRIC_TYPES.join(', ')}`);
    }
    if (typeof data.value !== 'number') errors.push('value doit etre un nombre');
    if (errors.length) {
      const err = new Error(errors.join(' ; '));
      err.name = 'ValidationError';
      throw err;
    }
  }

  toDocument() {
    const { eventId, metricType, value, timestamp } = this;
    return { eventId, metricType, value, timestamp };
  }
}

module.exports = Monitoring;
