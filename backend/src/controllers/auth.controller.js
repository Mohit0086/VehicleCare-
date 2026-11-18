const crypto = require('crypto');
const { safeBcrypt: bcrypt, safeJwt: jwt } = require('../utils/cryptoHelper');
const pool = require('../config/db');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { validateEmail } = require('../middleware/validate');
const SALT_ROUNDS = 10;
const text = (value) => typeof value === 'string' ? value.trim() : '';
const roleFor = (role) => ({ OWNER: 'CUSTOMER', CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN', MECHANIC: 'ADMIN', GARAGE: 'GARAGE' })[role];
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: roleFor(user.role) });
const issueToken = (user) => jwt.sign({ id: user.id, email: user.email, role: roleFor(user.role) }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

// Public registration always creates a customer. Admins are provisioned from the server CLI.
async function register(req, res, next) {
  const name = text(req.body.name);
  const email = text(req.body.email).toLowerCase();
  const phone = text(req.body.phone);
  const password = req.body.password;
  if (!name || name.length > 100 || !validateEmail(email) || email.length > 150 || !/^[+0-9 ()-]{7,25}$/.test(phone)) {
    return next(new AppError('Enter a name, valid email address and valid phone number.', 400));
  }
  if (typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    return next(new AppError('Password must be at least 6 characters and no more than 72 bytes.', 400));
  }
  if (req.body.role && !['CUSTOMER', 'OWNER'].includes(req.body.role)) {
    return next(new AppError('Public registration is available for customer accounts only.', 403));
  }
  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return next(new AppError('An account with this email already exists.', 409));
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, phone, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
      [name, email, passwordHash, 'CUSTOMER', phone]
    );
    const user = { id: result.insertId, name, email, phone, role: 'CUSTOMER' };
    return res.status(201).json({ message: 'Account created.', token: issueToken(user), user: publicUser(user) });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return next(new AppError('An account with this email already exists.', 409));
    return next(err);
  }
}

async function registerGarage(req, res, next) {
  const name = text(req.body.name);
  const email = text(req.body.email).toLowerCase();
  const phone = text(req.body.phone);
  const { password } = req.body;
  const garageName = text(req.body.garageName);
  const address = text(req.body.address);
  const city = text(req.body.city);
  const services = text(req.body.services);
  const capacity = Number(req.body.slotCapacity);

  if (!name || name.length > 100 || !validateEmail(email) || email.length > 150 ||
      !/^[+0-9 ()-]{7,20}$/.test(phone) || !garageName || garageName.length > 150 ||
      !address || address.length > 1000 || !city || city.length > 100 || services.length > 1000 ||
      !Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
    return next(new AppError('Enter valid contact, workshop and bay capacity details.', 400));
  }
  if (typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password) > 72) {
    return next(new AppError('Password must be at least 6 characters and no more than 72 bytes.', 400));
  }

  let connection;
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [user] = await connection.execute(
      "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, 'GARAGE', ?)",
      [name, email, hash, phone]
    );
    await connection.execute(
      'INSERT INTO service_centers (user_id, name, address, city, phone, services_offered, slot_capacity, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)',
      [user.insertId, garageName, address, city, phone, services || null, capacity]
    );
    await connection.commit();
    return res.status(201).json({ message: 'Garage registered. Your workshop is awaiting approval.' });
  } catch (err) {
    if (connection) await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') return next(new AppError('An account with this email already exists.', 409));
    return next(err);
  } finally {
    connection?.release();
  }
}

async function getGarage(req, res, next) {
  try {
    const [[garage]] = await pool.execute(
      'SELECT id, name, address, city, phone, slot_capacity, services_offered, is_active FROM service_centers WHERE user_id = ?',
      [req.user.id]
    );
    if (!garage) return next(new AppError('No workshop is linked to this account.', 404));
    return res.json({ garage });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  const email = text(req.body.email).toLowerCase();
  const password = req.body.password;
  if (!validateEmail(email) || typeof password !== 'string' || !password) {
    return next(new AppError('Enter your email address and password.', 400));
  }
  try {
    const [rows] = await pool.execute('SELECT id, name, email, phone, password_hash, role, is_active FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return next(new AppError('Invalid email or password.', 401));
    }
    if (!user.is_active || !roleFor(user.role)) {
      return next(new AppError('Your account is inactive. Contact the administrator.', 403));
    }
    const role = roleFor(user.role);
    const { accountType } = req.body;
    if (accountType && accountType !== role) {
      return next(new AppError('Select the sign-in option that matches your account.', 403));
    }
    return res.status(200).json({ message: 'Signed in.', token: issueToken(user), user: publicUser(user) });
  } catch (err) { return next(err); }
}

async function getProfile(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, phone, role, is_active FROM users WHERE id = ?', [req.user.id]);
    if (!rows[0] || !rows[0].is_active || !roleFor(rows[0].role)) {
      return next(new AppError('Your session is no longer valid. Please sign in again.', 401));
    }
    return res.status(200).json({ user: publicUser(rows[0]) });
  } catch (err) { return next(err); }
}

// Password reset request (FR-46)
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email || !validateEmail(email)) {
    return next(new AppError('Please provide a valid email address.', 400));
  }

  try {
    const [users] = await pool.execute('SELECT id, name FROM users WHERE email = ?', [email.toLowerCase().trim()]);

    if (users.length === 0) {
      // Do not leak user existence, return friendly response
      return res.status(200).json({
        message: 'If an account exists with that email, a password reset link has been dispatched.',
      });
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

    await pool.execute(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    console.log(`[Password Reset Link] For user ${user.name} (${email}): /reset-password?token=${resetToken}`);

    res.status(200).json({
      message: 'Password reset link sent to your registered email address.',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (err) {
    next(err);
  }
};

// Reset forgotten password using token (FR-46)
const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return next(new AppError('Token and new password are required.', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long.', 400));
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, user_id, expires_at, used FROM password_resets WHERE token = ?',
      [token]
    );

    if (rows.length === 0) {
      return next(new AppError('Invalid or expired password reset token.', 400));
    }

    const resetRecord = rows[0];

    if (resetRecord.used || new Date(resetRecord.expires_at) < new Date()) {
      return next(new AppError('This password reset link has already been used or has expired.', 400));
    }

    const newHash = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, resetRecord.user_id]);
    await pool.execute('UPDATE password_resets SET used = TRUE WHERE id = ?', [resetRecord.id]);

    res.status(200).json({
      message: 'Your password has been successfully reset. You may now log in.',
    });
  } catch (err) {
    next(err);
  }
};

// Logout endpoint (FR-45)
const logout = async (req, res) => {
  res.status(200).json({
    message: 'Logged out successfully. Remove the authentication token from this device.',
  });
};

module.exports = {
  register,
  registerGarage,
  getGarage,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  logout,
};
