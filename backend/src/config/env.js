const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../../.env');
try {
  const dotenv = require('dotenv');
  dotenv.config({ path: envPath });
} catch {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // ignore
    }
  }
}

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'vehiclecare_db',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'vehiclecare_jwt_default_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:6000',
};

module.exports = env;
