const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { validateEmail } = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const SALT_ROUNDS = 10;

// Register a new user (OWNER or MECHANIC)
const register = async (req, res, next) => {
  const { name, email, password, phone, role = ROLES.OWNER, centerName, address, city } = req.body;

  if (!name || !email || !password || !phone) {
    return next(new AppError('Name, email, password, and phone are required.', 400));
  }

  if (!validateEmail(email)) {
    return next(new AppError('Invalid email address format.', 400));
  }

  if (password.length < 6) {
    return next(new AppError('Password must be at least 6 characters long.', 400));
  }

  const normalizedRole = role.toUpperCase();
  if (![ROLES.OWNER, ROLES.MECHANIC].includes(normalizedRole)) {
    return next(new AppError('Invalid role specified. Only OWNER or MECHANIC can register.', 400));
  }

  if (normalizedRole === ROLES.MECHANIC && (!centerName || !address || !city)) {
    return next(new AppError('Mechanics must provide workshop centerName, address, and city.', 400));
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Check if email already registered
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return next(new AppError('An account with this email already exists.', 409));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const [userResult] = await connection.execute(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), passwordHash, normalizedRole, phone.trim()]
    );

    const userId = userResult.insertId;
    let serviceCenterId = null;

    // If mechanic, create service center profile
    if (normalizedRole === ROLES.MECHANIC) {
      const [centerResult] = await connection.execute(
        'INSERT INTO service_centers (user_id, name, address, city, phone) VALUES (?, ?, ?, ?, ?)',
        [userId, centerName.trim(), address.trim(), city.trim(), phone.trim()]
      );
      serviceCenterId = centerResult.insertId;
    }

    await connection.commit();

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email: email.toLowerCase().trim(), role: normalizedRole },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: normalizedRole,
        phone: phone.trim(),
        serviceCenterId,
      },
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// Login existing user
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required.', 400));
  }

  try {
    // Parameterised query to fetch user
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, role, phone FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const user = rows[0];

    // Verify bcrypt password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // If mechanic, retrieve service_center_id
    let serviceCenterId = null;
    if (user.role === ROLES.MECHANIC) {
      const [centers] = await pool.execute(
        'SELECT id FROM service_centers WHERE user_id = ?',
        [user.id]
      );
      if (centers.length > 0) {
        serviceCenterId = centers[0].id;
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        serviceCenterId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get current authenticated user profile
const getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return next(new AppError('User not found.', 404));
    }

    const user = rows[0];
    let serviceCenter = null;

    if (user.role === ROLES.MECHANIC) {
      const [centers] = await pool.execute(
        'SELECT id, name, address, city, phone, slot_capacity FROM service_centers WHERE user_id = ?',
        [user.id]
      );
      if (centers.length > 0) {
        serviceCenter = centers[0];
      }
    }

    res.status(200).json({
      user: {
        ...user,
        serviceCenter,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
