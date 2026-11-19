const crypto = require('node:crypto');
const pool = require('../config/db');
const { sendVerificationMail } = require('./passwordResetMail');

const hashVerificationToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

async function sendVerification(user, mail) {
  const token = crypto.randomBytes(32).toString('hex');
  const digest = hashVerificationToken(token);
  const [result] = await pool.execute(
    `UPDATE users SET email_verification_token_hash = ?,
                       email_verification_expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR),
                       email_verification_sent_at = NOW()
     WHERE id = ? AND is_active = TRUE AND email_verified_at IS NULL
       AND (email_verification_sent_at IS NULL OR email_verification_sent_at <= DATE_SUB(NOW(), INTERVAL 1 MINUTE))`,
    [digest, user.id]
  );
  if (!result.affectedRows) return 'skipped';

  try {
    await sendVerificationMail(mail, { email: user.email, token });
    return 'sent';
  } catch {
    await pool.execute(
      `UPDATE users SET email_verification_token_hash = NULL,
                         email_verification_expires_at = NULL,
                         email_verification_sent_at = NULL
       WHERE id = ? AND email_verification_token_hash = ?`,
      [user.id, digest]
    );
    console.error('[Email verification] Mail transport failed.');
    return 'failed';
  }
}

module.exports = { hashVerificationToken, sendVerification };
