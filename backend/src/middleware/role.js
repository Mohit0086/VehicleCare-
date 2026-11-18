const AppError = require('../utils/AppError');

// Role-based access control middleware
// Supports 2 primary user roles: CUSTOMER and ADMIN (with aliases OWNER/MECHANIC)
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('User authentication context missing.', 401));
    }

    const userRole = req.user.role.toUpperCase();
    const normalizedUserRole = userRole === 'OWNER' ? 'CUSTOMER' : userRole === 'MECHANIC' ? 'ADMIN' : userRole;

    const normalizedAllowed = allowedRoles.map((r) => {
      const u = r.toUpperCase();
      return u === 'OWNER' ? 'CUSTOMER' : u === 'MECHANIC' ? 'ADMIN' : u;
    });

    if (!normalizedAllowed.includes(normalizedUserRole)) {
      return next(new AppError(`Forbidden: Requires one of [${allowedRoles.join(', ')}] role.`, 403));
    }

    next();
  };
};

module.exports = requireRole;
