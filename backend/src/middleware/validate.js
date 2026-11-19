const AppError = require('../utils/AppError');

// Generic field validator middleware
const validate = (requiredFields) => {
  return (req, res, next) => {
    const missing = [];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return next(new AppError(`Missing required fields: ${missing.join(', ')}`, 400));
    }

    next();
  };
};

// Email format validator
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

function validateRegistrationEmail(email) {
  if (!validateEmail(email) || email.length > 150) return false;
  const [local, domain] = email.split('@');
  if (local.length > 64 || !/^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/i.test(local) ||
      local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  const labels = domain.split('.');
  return labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
    && /^[a-z]{2,63}$/i.test(labels.at(-1));
}

function normalizePhone(value) {
  if (typeof value !== 'string' || value.length > 32 || !/^\+?[0-9 ().-]+$/.test(value)) return null;
  const phone = value.replace(/[ ().-]/g, '');
  if (/^[6-9]\d{9}$/.test(phone)) return `+91${phone}`;
  if (phone.startsWith('+91')) return /^\+91[1-9]\d{9}$/.test(phone) ? phone : null;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

const PASSWORD_REQUIREMENTS = 'Use 8 or more characters, up to 72 bytes.';
const PHONE_REQUIREMENTS = 'Enter a 10-digit Indian mobile number or an international number with a country code.';

function validatePassword(password) {
  return typeof password === 'string' && Array.from(password).length >= 8
    && password.trim().length > 0 && Buffer.byteLength(password, 'utf8') <= 72;
}

module.exports = {
  validate,
  validateEmail,
  validateRegistrationEmail,
  normalizePhone,
  validatePassword,
  PASSWORD_REQUIREMENTS,
  PHONE_REQUIREMENTS,
};
