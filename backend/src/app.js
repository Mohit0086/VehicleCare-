const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// Import routes
const authRoutes = require('./routes/auth.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const bookingRoutes = require('./routes/booking.routes');
const billRoutes = require('./routes/bill.routes');
const reminderRoutes = require('./routes/reminder.routes');
const documentRoutes = require('./routes/document.routes');
const adminRoutes = require('./routes/admin.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const predictionRoutes = require('./routes/prediction.routes');

const bookingController = require('./controllers/booking.controller');
const documentController = require('./controllers/document.controller');
const predictionController = require('./controllers/prediction.controller');
const authenticateToken = require('./middleware/auth');
const requireRole = require('./middleware/role');
const vehicleAccess = requireRole('CUSTOMER', 'ADMIN');

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint (FR-3.1.3)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'VehicleCare API is running.' });
});

// Mount core routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/vehicles/:vehicleId/documents', documentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Direct convenience routes matching frontend api client
app.get('/api/service-centers', bookingController.listServiceCenters);
app.get('/api/documents/:id/download', authenticateToken, vehicleAccess, documentController.downloadDocument);
app.delete('/api/documents/:id', authenticateToken, vehicleAccess, documentController.deleteDocument);
app.get('/api/vehicles/:id/prediction', authenticateToken, vehicleAccess, predictionController.getVehiclePrediction);

// 404 Handler for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Endpoint not found: ${req.originalUrl}`, 404));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
