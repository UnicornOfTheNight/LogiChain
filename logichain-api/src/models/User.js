class User {
  static ROLES = ['admin', 'responsable_logistique', 'agent_terrain', 'transporteur'];

  constructor({ email, passwordHash, role = 'agent_terrain', name }) {
    this.email = email.toLowerCase().trim();
    this.passwordHash = passwordHash;
    this.role = role;
    this.name = name;
    this.createdAt = new Date();
  }

  static validate(data) {
    const errors = [];
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('email invalide');
    if (!data.password || data.password.length < 8) errors.push('password doit contenir au moins 8 caracteres');
    if (data.role && !User.ROLES.includes(data.role)) errors.push(`role doit etre parmi ${User.ROLES.join(', ')}`);
    if (errors.length) {
      const err = new Error(errors.join(' ; '));
      err.name = 'ValidationError';
      throw err;
    }
  }

  toDocument() {
    const { email, passwordHash, role, name, createdAt } = this;
    return { email, passwordHash, role, name, createdAt };
  }

  // Ne jamais exposer passwordHash au client
  static toPublic(userDoc) {
    return { id: userDoc._id, email: userDoc.email, role: userDoc.role, name: userDoc.name };
  }
}

module.exports = User;
