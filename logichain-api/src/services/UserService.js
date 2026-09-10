const userRepository = require('../repositories/UserRepository');
const User = require('../models/User');

class UserService {
  // Liste des utilisateurs assignables (agents de terrain, transporteurs...)
  // Ne retourne jamais passwordHash (cf. User.toPublic).
  async listByRole(role) {
    const filter = role ? { role } : {};
    const users = await userRepository.findAll(filter, { limit: 200 });
    return users.map(User.toPublic);
  }
}

module.exports = new UserService();
