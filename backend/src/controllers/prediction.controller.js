/**
 * Prediction Controller
 * Implements SRS FR-35 to FR-40.
 */

const { buildFeaturesForVehicle } = require('../services/featureService');
const { predictMaintenance } = require('../services/mlClient');

// Get maintenance predictions for a specific vehicle
const getVehiclePrediction = async (req, res, next) => {
  const { id } = req.params;

  try {
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
