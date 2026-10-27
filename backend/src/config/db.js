const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool(env.db);

// Verify DB connection on startup
pool.getConnection()
  .then((conn) => {
    console.log(`[Database] Connected to MySQL (${env.db.database}) successfully.`);
    conn.release();
  })
  .catch((err) => {
    console.error(`[Database Error] Connection failed: ${err.message}`);
  });

module.exports = pool;
