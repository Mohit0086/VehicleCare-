const crypto = require('crypto');
const { safeBcrypt: bcrypt, safeJwt: jwt } = require('../utils/cryptoHelper');
const pool = require('../config/db');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const {
  validateEmail, validateRegistrationEmail, normalizePhone, validatePassword,
  PASSWORD_REQUIREMENTS, PHONE_REQUIREMENTS,
} = require('../middleware/validate');
const { getMailConfig, sendResetMail } = require('../services/passwordResetMail');
const { hashVerificationToken, sendVerification } = require('../services/emailVerification');
const SALT_ROUNDS = 10;
const text = (value) => typeof value === 'string' ? value.trim() : '';
const roleFor = (role) => ({ OWNER: 'CUSTOMER', CUSTOMER: 'CUSTOMER', ADMIN: 'ADMIN', MECHANIC: 'ADMIN', GARAGE: 'GARAGE' })[role];
const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: roleFor(user.role) });
const issueToken = (user) => jwt.sign({ id: user.id, email: user.email, role: roleFor(user.role) }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

// Public registration always creates a customer. Admins are provisioned from the server CLI.
async function register(req, res, next) {
  const name = text(req.body.name);
  const email = text(req.body.email).toLowerCase();
  const phone = normalizePhone(text(req.body.phone));
  const password = req.body.password;
  if (!name || name.length > 100) return next(new AppError('Enter a name of up to 100 characters.', 400));
  if (!validateRegistrationEmail(email)) return next(new AppError('Enter a valid email address.', 400));
  if (!phone) return next(new AppError(PHONE_REQUIREMENTS, 400));
  if (!validatePassword(password)) return next(new AppError(PASSWORD_REQUIREMENTS, 400));
  if (req.body.role && !['CUSTOMER', 'OWNER'].includes(req.body.role)) {
    return next(new AppError('Public registration is available for customer accounts only.', 403));
  }
  const mail = getMailConfig();
  if (!mail) return next(new AppError('Registration is unavailable because verification email is not configured.', 503));

  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return next(new AppError('An account with this email already exists.', 409));
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, phone, is_active, email_verified_at) VALUES (?, ?, ?, ?, ?, TRUE, NULL)',
      [name, email, passwordHash, 'CUSTOMER', phone]
    );
    const delivery = await sendVerification({ id: result.insertId, email }, mail);
    return res.status(201).json({ verificationEmailSent: delivery === 'sent' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return next(new AppError('An account with this email already exists.', 409));
    return next(err);
  }
}

async function registerGarage(req, res, next) {
  const name = text(req.body.name);
  const email = text(req.body.email).toLowerCase();
  const phone = normalizePhone(text(req.body.phone));
  const { password } = req.body;
  const garageName = text(req.body.garageName);
  const address = text(req.body.address);
  const city = text(req.body.city);
  const services = text(req.body.services);
  const capacity = Number(req.body.slotCapacity);

  if (!name || name.length > 100) return next(new AppError('Enter a name of up to 100 characters.', 400));
  if (!validateRegistrationEmail(email)) return next(new AppError('Enter a valid email address.', 400));
  if (!phone) return next(new AppError(PHONE_REQUIREMENTS, 400));
  if (!validatePassword(password)) return next(new AppError(PASSWORD_REQUIREMENTS, 400));
  if (!garageName || garageName.length > 150 || !address || address.length > 1000 ||
      !city || city.length > 100 || services.length > 1000 ||
      !Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
    return next(new AppError('Enter valid workshop details and a capacity from 1 to 100 vehicles per slot.', 400));
  }

  const mail = getMailConfig();
  if (!mail) return next(new AppError('Registration is unavailable because verification email is not configured.', 503));

  let userId;
  let connection;
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [user] = await connection.execute(
      "INSERT INTO users (name, email, password_hash, role, phone, email_verified_at) VALUES (?, ?, ?, 'GARAGE', ?, NULL)",
      [name, email, hash, phone]
    );
    await connection.execute(
      'INSERT INTO service_centers (user_id, name, address, city, phone, services_offered, slot_capacity, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)',
      [user.insertId, garageName, address, city, phone, services || null, capacity]
    );
    userId = user.insertId;
    await connection.commit();
  } catch (err) {
    if (connection) await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') return next(new AppError('An account with this email already exists.', 409));
    return next(err);
  } finally {
    connection?.release();
  }
  try {
    const delivery = await sendVerification({ id: userId, email }, mail);
    return res.status(201).json({ verificationEmailSent: delivery === 'sent' });
  } catch (err) {
    return next(err);
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
    const [rows] = await pool.execute('SELECT id, name, email, phone, password_hash, role, is_active, email_verified_at FROM users WHERE email = ?', [email]);
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
    if (!user.email_verified_at) {
      return res.status(403).json({ error: 'Verify your email before signing in.', code: 'EMAIL_UNVERIFIED' });
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

async function resendVerification(req, res, next) {
  const email = text(req.body.email).toLowerCase();
  if (!validateEmail(email) || email.length > 150) return next(new AppError('Enter a valid email address.', 400));
  const mail = getMailConfig();
  if (!mail) return next(new AppError('Verification email is unavailable. Contact the administrator.', 503));

  try {
    const [[user]] = await pool.execute(
      'SELECT id, email FROM users WHERE email = ? AND is_active = TRUE AND email_verified_at IS NULL',
      [email]
    );
    if (user) {
      const delivery = await sendVerification(user, mail);
      if (delivery === 'failed') return next(new AppError('Could not send a verification email. Try again later.', 503));
    }
    return res.json({ message: 'If this account still needs verification, check your inbox for a link. Wait a minute before requesting another.' });
  } catch (err) {
    return next(err);
  }
}

async function verifyEmail(req, res, next) {
  const { token, password } = req.body;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return next(new AppError('This link is invalid or expired. Request a new one.', 400));
  }
  if (typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
    return next(new AppError('Enter the password you chose when registering.', 400));
  }

  const digest = hashVerificationToken(token);
  try {
    const [[user]] = await pool.execute(
      `SELECT id, role, password_hash FROM users
       WHERE email_verification_token_hash = ? AND email_verification_expires_at > NOW()
         AND email_verified_at IS NULL AND is_active = TRUE`,
      [digest]
    );
    if (!user) return next(new AppError('This link is invalid or expired. Request a new one.', 400));
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return next(new AppError('The password does not match this account.', 401));
    }
    const [result] = await pool.execute(
      `UPDATE users SET email_verified_at = NOW(), email_verification_token_hash = NULL,
                         email_verification_expires_at = NULL, email_verification_sent_at = NULL
       WHERE id = ? AND email_verification_token_hash = ? AND email_verification_expires_at > NOW()
         AND email_verified_at IS NULL AND is_active = TRUE`,
      [user.id, digest]
    );
    if (!result.affectedRows) return next(new AppError('This link is no longer valid. Sign in or request a new one.', 400));
    return res.json({ role: roleFor(user.role) });
  } catch (err) {
    return next(err);
  }
}

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const forgotPassword = async (req, res, next) => {
  const email = text(req.body.email).toLowerCase();
  if (!validateEmail(email) || email.length > 150) {
    return next(new AppError('Please provide a valid email address.', 400));
  }

  const mail = getMailConfig();
  if (!mail) return next(new AppError('Password reset email is unavailable. Contact the administrator.', 503));

  try {
    const [[user]] = await pool.execute('SELECT id FROM users WHERE email = ? AND is_active = TRUE AND email_verified_at IS NOT NULL', [email]);
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const digest = hashResetToken(token);
      await pool.execute(
        'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
        [user.id, digest]
      );
      try {
        await sendResetMail(mail, { email, token });
      } catch {
        await pool.execute('DELETE FROM password_resets WHERE token = ?', [digest]);
        console.error('[Password reset] Mail transport failed.');
        return next(new AppError('Password reset email is unavailable. Try again later.', 503));
      }
    }
    return res.json({ message: 'If an active account exists, a password reset link will be sent.' });
  } catch (err) {
    return next(err);
  }
};

const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return next(new AppError('Invalid or expired password reset link.', 400));
  }
  if (!validatePassword(password)) return next(new AppError(PASSWORD_REQUIREMENTS, 400));

  const digest = hashResetToken(token);
  let connection;
  try {
    const [[record]] = await pool.execute(
      'SELECT user_id FROM password_resets WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [digest]
    );
    if (!record) return next(new AppError('Invalid or expired password reset link.', 400));

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [[user]] = await connection.execute('SELECT is_active FROM users WHERE id = ? FOR UPDATE', [record.user_id]);
    if (!user?.is_active) throw new AppError('Invalid or expired password reset link.', 400);

    const [claimed] = await connection.execute(
      'UPDATE password_resets SET used = TRUE WHERE token = ? AND used = FALSE AND expires_at > NOW()',
      [digest]
    );
    if (!claimed.affectedRows) throw new AppError('Invalid or expired password reset link.', 400);

    await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, record.user_id]);
    await connection.execute('UPDATE password_resets SET used = TRUE WHERE user_id = ? AND used = FALSE', [record.user_id]);
    await connection.commit();
    return res.json({ message: 'Password reset. Sign in with your new password.' });
  } catch (err) {
    if (connection) await connection.rollback();
    return next(err);
  } finally {
    connection?.release();
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
  resendVerification,
  verifyEmail,
  getGarage,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  logout,
};
