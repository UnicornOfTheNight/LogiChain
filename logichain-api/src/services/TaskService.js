const Task = require('../models/Task');
const taskRepository = require('../repositories/TaskRepository');
const realtimeHub = require('../lib/realtime');

class TaskService {
  async createTask(payload) {
    Task.validate(payload);
    const task = new Task(payload);
    const created = await taskRepository.create(task.toDocument());

    // Notifie l'agent/transporteur assigne via le flux d'alertes temps reel
    realtimeHub.publishAlert(String(created.eventId), {
      type: 'nouvelle_tache',
      itemId: String(created._id),
      label: created.title,
      note: 'Nouvelle tache assignee'
    });

    return created;
  }

  async listByEvent(eventId, pagination) {
    return taskRepository.findByEvent(eventId, pagination);
  }

  async listMine(userId, pagination) {
    return taskRepository.findByAssignee(userId, pagination);
  }

  async updateStatus(taskId, currentVersion, status) {
    Task.validateStatus(status);
    const updated = await taskRepository.updateWithLock(taskId, currentVersion, { status });
    if (!updated) {
      const err = new Error('CONFLIT_VERSION');
      err.statusCode = 409;
      throw err;
    }
    return updated;
  }
}

module.exports = new TaskService();
