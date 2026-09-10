const userService = require('../services/UserService');
const { sendJson } = require('../lib/http');

class UserController {
  async list(ctx, res) {
    const users = await userService.listByRole(ctx.query.role);
    sendJson(res, 200, users);
  }
}

module.exports = new UserController();
