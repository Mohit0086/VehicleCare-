const { safeJwt: jwt } = require('../utils/cryptoHelper');
const env = require('../config/env');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

module.exports = async function authenticateToken(req, res, next) {
  const parts = (req.headers.authorization || '').split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return next(new AppError('Please sign in to continue.', 401));
  }
  let payload;
  try { payload = jwt.verify(parts[1], env.jwt.secret, { algorithms: ['HS256'] }); }
  catch { return next(new AppError('Invalid or expired authentication token.', 401)); }
  if (!payload || !Number.isInteger(payload.id)) return next(new AppError('Invalid authentication token.', 401));
  try {
    const [rows] = await pool.execute('SELECT id, email, name, role, is_active, email_verified_at FROM users WHERE id = ?', [payload.id]);
    const user = rows[0];
    const role = { ADMIN: 'ADMIN', CUSTOMER: 'CUSTOMER', OWNER: 'CUSTOMER', MECHANIC: 'ADMIN', GARAGE: 'GARAGE' }[user?.role];
    if (!user || !user.is_active || !user.email_verified_at || !role) return next(new AppError('Your account is unavailable. Please sign in again.', 401));
    req.user = { id: user.id, email: user.email, name: user.name, role };
    return next();
  } catch (err) { return next(err); }
};
