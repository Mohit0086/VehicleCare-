const { randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const { isAbsolute } = require('node:path');
const env = require('../config/env');
const { validateEmail } = require('../middleware/validate');

function getMailConfig() {
  const { appUrl, from, sendmailPath } = env.passwordReset || {};
  if (!appUrl || !from || !validateEmail(from) || !sendmailPath || !isAbsolute(sendmailPath)) return null;

  try {
    const origin = new URL(appUrl);
    if (origin.protocol !== 'https:' && !(origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname))) return null;
    return { origin: origin.origin, from, sendmailPath };
  } catch {
    return null;
  }
}

function sendAccountMail({ origin, from, sendmailPath }, { email, token, path, subject, introduction }) {
  const url = new URL(path, origin);
  url.searchParams.set('token', token);
  const message = [
    `From: ${from}`,
    `To: ${email}`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${randomUUID()}@${from.split('@')[1]}>`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    '',
    introduction,
    url.toString(),
    '',
    'If you did not request this, you can ignore this email.',
    '',
  ].join('\r\n');

  return new Promise((resolve, reject) => {
    const child = spawn(sendmailPath, ['-i', '-t'], { stdio: ['pipe', 'ignore', 'ignore'], timeout: 10000, killSignal: 'SIGKILL' });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error('The local mail transport rejected the message.'));
    });
    child.stdin.once('error', reject);
    child.stdin.end(message);
  });
}

function sendResetMail(mail, details) {
  return sendAccountMail(mail, {
    ...details,
    path: '/reset-password',
    subject: 'Reset your VehicleCare password',
    introduction: 'Use the link below to reset your VehicleCare password. It expires in one hour.',
  });
}

function sendVerificationMail(mail, details) {
  return sendAccountMail(mail, {
    ...details,
    path: '/verify-email',
    subject: 'Verify your VehicleCare email',
    introduction: 'Use the link below to verify your email address. It expires in 24 hours.',
  });
}

module.exports = { getMailConfig, sendResetMail, sendVerificationMail };
