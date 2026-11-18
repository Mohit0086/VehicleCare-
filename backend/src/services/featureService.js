/**
 * Feature Engineering Service for ML Prediction Microservice
 * Implements SRS FR-36 and FR-40 (default values for sparse history).
 */

const pool = require('../config/db');

/**
 * Builds the feature set required by the scikit-learn ML microservice.
 * Features:
 * - vehicle_age (years)
 * - current_km (total odometer reading)
 * - avg_km_per_month (historical usage rate)
 * - last_service_interval (km since prior service)
 * - repair_count (number of past completed service jobs)
 * - fuel_type (PETROL, DIESEL, CNG, ELECTRIC, HYBRID)
 */
async function buildFeaturesForVehicle(vehicleId) {
  // 1. Fetch vehicle core data
  const [vehicles] = await pool.execute(
    'SELECT id, brand, model, year, fuel_type, current_km, created_at FROM vehicles WHERE id = ?',
    [vehicleId]
  );

  if (vehicles.length === 0) {
    throw new Error(`Vehicle with ID ${vehicleId} not found.`);
  }

  const v = vehicles[0];
  const currentYear = new Date().getFullYear();
  const vehicleAge = Math.max(0, currentYear - v.year);

  // 2. Compute completed repair/service count
  const [repairRows] = await pool.execute(
    "SELECT COUNT(*) as count FROM bookings WHERE vehicle_id = ? AND status = 'COMPLETED'",
    [vehicleId]
  );
  const repairCount = repairRows[0]?.count || 0;

  // 3. Compute last service interval
  const [lastServiceRows] = await pool.execute(
    "SELECT odometer_at_service, booking_date FROM bookings WHERE vehicle_id = ? AND status = 'COMPLETED' ORDER BY booking_date DESC, id DESC LIMIT 1",
    [vehicleId]
  );

  let lastServiceInterval = 10000; // Standard default if insufficient history (FR-40)
  if (lastServiceRows.length > 0 && lastServiceRows[0].odometer_at_service) {
    lastServiceInterval = Math.max(1000, v.current_km - lastServiceRows[0].odometer_at_service);
  }

  // 4. Compute average km per month
  // Use odometer logs if available; otherwise calculate from vehicle age and current km
  let avgKmPerMonth = 1000; // Reasonable default fallback

  const [odoLogs] = await pool.execute(
    'SELECT reading_km, recorded_at FROM odometer_logs WHERE vehicle_id = ? ORDER BY recorded_at ASC',
    [vehicleId]
  );

  if (odoLogs.length >= 2) {
    const firstLog = odoLogs[0];
    const lastLog = odoLogs[odoLogs.length - 1];
    const diffKm = Math.max(0, lastLog.reading_km - firstLog.reading_km);
    const monthsDiff = Math.max(1, (new Date(lastLog.recorded_at) - new Date(firstLog.recorded_at)) / (1000 * 60 * 60 * 24 * 30));
    avgKmPerMonth = Math.round(diffKm / monthsDiff);
  } else {
    const monthsOwned = Math.max(1, (new Date() - new Date(v.created_at)) / (1000 * 60 * 60 * 24 * 30));
    avgKmPerMonth = Math.round(v.current_km / Math.max(monthsOwned, vehicleAge * 12 || 1));
  }

  // Ensure reasonable bounds
  avgKmPerMonth = Math.max(100, Math.min(avgKmPerMonth, 10000));

  return {
    vehicle_age: vehicleAge,
    current_km: v.current_km,
    avg_km_per_month: avgKmPerMonth,
    last_service_interval: lastServiceInterval,
    repair_count: repairCount,
    fuel_type: v.fuel_type,
  };
}

module.exports = {
  buildFeaturesForVehicle,
};
