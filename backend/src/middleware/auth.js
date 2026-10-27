const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next(new AppError('Access denied. No authorization header provided.', 401));
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(new AppError('Invalid token format. Expected "Bearer <token>".', 401));
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
};

module.exports = authenticateToken;
