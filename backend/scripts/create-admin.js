const { createInterface } = require('node:readline/promises');
const { Writable } = require('node:stream');
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');
const { validateEmail } = require('../src/middleware/validate');

async function main() {
  let hidden = false;
  const output = new Writable({ write(chunk, encoding, done) { if (!hidden) process.stdout.write(chunk); done(); } });
  const prompt = createInterface({ input: process.stdin, output, terminal: !!process.stdin.isTTY });
  try {
    const name = (await prompt.question('Admin name: ')).trim();
    const email = (await prompt.question('Admin email: ')).trim().toLowerCase();
    const phone = (await prompt.question('Phone number: ')).trim();
    process.stdout.write('New admin password (hidden): ');
    hidden = true;
    const password = await prompt.question('');
    process.stdout.write('\nConfirm password (hidden): ');
    const confirmation = await prompt.question('');
    hidden = false;
    process.stdout.write('\n');
    if (!name || name.length > 100 || !validateEmail(email) || email.length > 150 || !/^[+0-9 ()-]{7,25}$/.test(phone)) throw new Error('Enter a valid name, email and phone number.');
    if (password !== confirmation) throw new Error('Passwords do not match. Enter the password twice, pressing Enter after each entry.');
    if (password.length < 6 || Buffer.byteLength(password) > 72) throw new Error('Password must be at least 6 characters and at most 72 bytes.');
    const [existing] = await pool.execute('SELECT id, role FROM users WHERE email = ?', [email]);
    if (existing.length && existing[0].role !== 'ADMIN') throw new Error('That email belongs to a non-admin account. Choose another email.');
    const hash = await bcrypt.hash(password, 10);
    if (existing.length) {
      await pool.execute('UPDATE users SET name = ?, phone = ?, password_hash = ?, is_active = TRUE WHERE id = ?', [name, phone, hash, existing[0].id]);
    } else {
      await pool.execute("INSERT INTO users (name, email, phone, password_hash, role, is_active) VALUES (?, ?, ?, ?, 'ADMIN', TRUE)", [name, email, phone, hash]);
    }
    console.log(`Admin ready: ${email}. Sign in through /login.`);
  } finally { prompt.close(); await pool.end(); }
}
console.log('Create an admin or reset an existing admin password. Enter the password twice when prompted.');
main().catch((err) => { console.error(err.message); process.exitCode = 1; });
