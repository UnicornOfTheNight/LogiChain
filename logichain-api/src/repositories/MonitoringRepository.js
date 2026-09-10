const { ObjectId } = require('../config/database');
const BaseRepository = require('./BaseRepository');

class MonitoringRepository extends BaseRepository {
  constructor() {
    super('monitoring');
  }

  async recordMetric(eventId, metricType, value, timestamp = new Date()) {
    return this.collection.insertOne({ eventId: new ObjectId(eventId), metricType, value, timestamp });
  }

  async history(eventId, metricType, since) {
    return this.collection
      .find({ eventId: new ObjectId(eventId), metricType, timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .toArray();
  }
}

module.exports = new MonitoringRepository();
