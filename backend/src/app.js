const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// Import routes
const authRoutes = require('./routes/auth.routes');

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'VehicleCare API is running.' });
});

// Mount routes
app.use('/api/auth', authRoutes);

// 404 Handler for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Endpoint not found: ${req.originalUrl}`, 404));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
