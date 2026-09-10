const authService = require('../services/AuthService');
const { sendJson } = require('../lib/http');

class AuthController {
  async register(ctx, res) {
    const result = await authService.register(ctx.body);
    sendJson(res, 201, result);
  }

  async login(ctx, res) {
    const { email, password } = ctx.body;
    const result = await authService.login(email, password);
    sendJson(res, 200, result);
  }

  async refresh(ctx, res) {
    const { refreshToken } = ctx.body;
    const result = await authService.refresh(refreshToken);
    sendJson(res, 200, result);
  }

  async me(ctx, res) {
    sendJson(res, 200, ctx.user);
  }
}

module.exports = new AuthController();
