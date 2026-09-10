const User = require('../models/User');
const userRepository = require('../repositories/UserRepository');
const { hashPassword, verifyPassword } = require('../lib/password');
const jwt = require('../lib/jwt');

const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes : duree volontairement courte
const REFRESH_TOKEN_TTL = 7 * 24 * 3600; // 7 jours

function accessSecret() {
  return process.env.JWT_ACCESS_SECRET || 'dev-access-secret-a-changer-en-production';
}
function refreshSecret() {
  return process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-a-changer-en-production';
}

class AuthService {
  async register(payload) {
    User.validate(payload);
    const existing = await userRepository.findByEmail(payload.email);
    if (existing) {
      const err = new Error('EMAIL_DEJA_UTILISE');
      err.statusCode = 409;
      throw err;
    }
    const passwordHash = hashPassword(payload.password);
    const user = new User({ email: payload.email, passwordHash, role: payload.role, name: payload.name });
    const created = await userRepository.create(user.toDocument());
    return this._issueTokens(created);
  }

  async login(email, password) {
    const invalidCredentials = () => {
      const err = new Error('IDENTIFIANTS_INVALIDES');
      err.statusCode = 401;
      return err;
    };
    if (!email || !password) throw invalidCredentials();

    const userDoc = await userRepository.findByEmail(email);
    if (!userDoc || !verifyPassword(password, userDoc.passwordHash)) {
      throw invalidCredentials();
    }
    return this._issueTokens(userDoc);
  }

  // Renouvelle un access token a partir d'un refresh token valide (intercepteur cote client)
  async refresh(refreshToken) {
    const payload = jwt.verify(refreshToken, refreshSecret());
    if (payload.type !== 'refresh') {
      const err = new Error('TOKEN_INVALIDE');
      err.statusCode = 401;
      throw err;
    }
    const userDoc = await userRepository.findById(payload.sub);
    if (!userDoc) {
      const err = new Error('UTILISATEUR_INTROUVABLE');
      err.statusCode = 401;
      throw err;
    }
    return this._issueTokens(userDoc);
  }

  _issueTokens(userDoc) {
    const accessToken = jwt.sign(
      { sub: String(userDoc._id), role: userDoc.role, type: 'access' },
      accessSecret(),
      ACCESS_TOKEN_TTL
    );
    const refreshToken = jwt.sign(
      { sub: String(userDoc._id), type: 'refresh' },
      refreshSecret(),
      REFRESH_TOKEN_TTL
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL,
      user: User.toPublic(userDoc)
    };
  }
}

module.exports = new AuthService();
