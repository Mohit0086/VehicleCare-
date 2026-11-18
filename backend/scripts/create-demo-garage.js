const { randomBytes } = require('node:crypto');
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

const email = 'demo.garage@vehiclecare.test';

async function setup() {
  const connection = await pool.getConnection();
  try {
    const [[column]] = await connection.query("SHOW COLUMNS FROM users LIKE 'role'");
    if (!column?.Type.includes("'GARAGE'")) throw new Error('Apply database/migrations/001-garage-role.sql first.');

    await connection.beginTransaction();
    const [[existing]] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      console.log(`Demo garage already exists: ${email}`);
      return;
    }

    const password = 'Garage!' + randomBytes(12).toString('base64url');
    const hash = await bcrypt.hash(password, 10);
    const [[demoCenter]] = await connection.execute(
      `SELECT sc.id, u.id AS owner_id FROM service_centers sc
       JOIN users u ON u.id = sc.user_id
       WHERE u.email = 'demo.workshop@vehiclecare.test' AND u.is_active = FALSE
         AND sc.name = 'VehicleCare Demo Workshop'
       FOR UPDATE`
    );

    if (demoCenter) {
      await connection.execute(
        "UPDATE users SET email = ?, password_hash = ?, role = 'GARAGE', is_active = TRUE WHERE id = ?",
        [email, hash, demoCenter.owner_id]
      );
      await connection.execute('UPDATE service_centers SET is_active = TRUE WHERE id = ?', [demoCenter.id]);
    } else {
      const [owner] = await connection.execute(
        "INSERT INTO users (name, email, password_hash, role, phone) VALUES ('Demo Garage Owner', ?, ?, 'GARAGE', '9000000102')",
        [email, hash]
      );
      await connection.execute(
        `INSERT INTO service_centers (user_id, name, address, city, phone, services_offered, slot_capacity, is_active)
         VALUES (?, 'VehicleCare Demo Workshop', 'Demo Industrial Area', 'Bhopal', '9000000102', 'General service, brakes, oil and EV inspection', 4, TRUE)`,
        [owner.insertId]
      );
    }

    await connection.commit();
    console.log(JSON.stringify({ email, password, linkedExistingBookings: Boolean(demoCenter) }));
  } finally {
    await connection.rollback();
    connection.release();
  }
}

setup().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
}).finally(() => pool.end());
