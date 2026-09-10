const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    return this.collection.findOne({ email: email.toLowerCase().trim() });
  }
}

module.exports = new UserRepository();
