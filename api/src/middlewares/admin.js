const UnauthorizedError = require('../packages/errors/unauthorized');
const ForbiddenError = require('../packages/errors/forbidden');
const { isAdmin } = require('../routes/users/helpers');

const admin = function admin(req, res, next) {
  if (!req.user) {
    throw new UnauthorizedError('Connected user required');
  }

  if (!isAdmin(req.user)) {
    throw new ForbiddenError('Admin expected');
  }

  next();
};

module.exports = admin;