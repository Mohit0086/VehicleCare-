const AppError = require('../utils/AppError');

// Role-based access control middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('User authentication context missing.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(`Forbidden: Requires one of [${allowedRoles.join(', ')}] role.`, 403));
    }

    next();
  };
};

module.exports = requireRole;
