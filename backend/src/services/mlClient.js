/**
 * ML Microservice Client & Rule-Based Fallback
 * Implements SRS FR-35, FR-38, FR-39 (graceful fallback).
 */

const env = require('../config/env');

/**
 * Derives a rule-based prediction if ML service is unreachable (FR-39).
 */
function getRuleBasedFallbackPrediction(features) {
  // Synthetic baseline heuristic
  const oilChangeRemaining = Math.max(500, 10000 - (features.current_km % 10000));
  const brakeInspectionRemaining = Math.max(1000, 15000 - (features.current_km % 15000));

  // Baseline cost estimation in INR
  let baseCost = 4500;
  if (features.fuel_type === 'DIESEL') baseCost += 1200;
  if (features.fuel_type === 'ELECTRIC') baseCost -= 800;
  if (features.vehicle_age > 4) baseCost += 1500;
  if (features.repair_count > 3) baseCost += 1000;

  return {
    oil_change_km: features.fuel_type === 'ELECTRIC' ? 0 : Math.round(oilChangeRemaining),
    brake_inspection_km: Math.round(brakeInspectionRemaining),
    estimated_cost: Math.round(baseCost),
    fallback: true,
    message: 'Estimated using rule-based calculations because the ML prediction service was offline.',
  };
}

/**
 * Predicts next service distance and cost via the Flask ML service, with rule fallback.
 */
async function predictMaintenance(features) {
  const url = `${env.mlServiceUrl}/predict`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second SLA (3.4.1)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`ML service responded with status: ${response.status}`);
    }

    const data = await response.json();
    return {
      oil_change_km: Math.round(data.oil_change_km),
      brake_inspection_km: Math.round(data.brake_inspection_km),
      estimated_cost: Math.round(data.estimated_cost),
      fallback: data.model_version === 'heuristic-fallback',
    };
  } catch (err) {
    console.warn(`[ML Client] Prediction microservice request failed (${err.message}). Activating rule-based fallback.`);
    return getRuleBasedFallbackPrediction(features);
  }
}

module.exports = {
  predictMaintenance,
  getRuleBasedFallbackPrediction,
};
