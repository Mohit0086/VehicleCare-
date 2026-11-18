/**
 * Prediction Controller
 * Implements SRS FR-35 to FR-40.
 */

const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { buildFeaturesForVehicle } = require('../services/featureService');
const { predictMaintenance } = require('../services/mlClient');

// Get maintenance predictions for a specific vehicle
const getVehiclePrediction = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [vehicles] = await pool.execute('SELECT id, user_id, reg_no FROM vehicles WHERE id = ?', [id]);
    if (vehicles.length === 0) return next(new AppError('Vehicle not found.', 404));

    // 1. Build features from database (FR-36, FR-40)
    const features = await buildFeaturesForVehicle(id);

    // 2. Query ML microservice with fallback (FR-35, FR-37, FR-39)
    const prediction = await predictMaintenance(features);

    res.status(200).json({
      vehicle_id: id,
      features,
      prediction,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVehiclePrediction,
};
