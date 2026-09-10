const { ObjectId } = require('../config/database');
const BaseRepository = require('./BaseRepository');

class TaskRepository extends BaseRepository {
  constructor() {
    super('tasks');
  }

  async create(document) {
    const doc = {
      ...document,
      eventId: new ObjectId(document.eventId),
      assignedToUserId: new ObjectId(document.assignedToUserId)
    };
    return super.create(doc);
  }

  async findByEvent(eventId, pagination = {}) {
    return this.findAll({ eventId: new ObjectId(eventId) }, pagination);
  }

  async findByAssignee(userId, pagination = {}) {
    return this.findAll({ assignedToUserId: new ObjectId(userId) }, pagination);
  }

  async updateWithLock(id, currentVersion, data) {
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id), version: currentVersion },
      { $set: { ...data, updatedAt: new Date() }, $inc: { version: 1 } },
      { returnDocument: 'after' }
    );
    return result.value;
  }
}

module.exports = new TaskRepository();
