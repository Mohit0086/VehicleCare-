/**
 * Maintenance Status Calculation Service
 * Implements SRS FR-11 to FR-15, FR-48 and Section 4.1 worked example rule.
 */

const { MAINTENANCE_STATUS } = require('../utils/constants');

/**
 * Calculates maintenance status for a single component.
 *
 * Rule:
 * Next due km = last_done_km + interval_km
 * Remaining km = next_due_km - current_km
 * Due Soon threshold km = 15% of interval_km (FR-13)
 *
 * Next due date = last_done_date + interval_months (FR-14)
 * Condition reached first decides status.
 */
function calculateComponentStatus(component, currentKm) {
  const intervalKm = component.interval_km || component.default_interval_km || 10000;
  const intervalMonths = component.interval_months || component.default_interval_months || 6;
  const lastDoneKm = component.last_done_km || 0;
  const lastDoneDate = component.last_done_date ? new Date(component.last_done_date) : new Date();

  // 1. Distance-based calculation
  const nextDueKm = lastDoneKm + intervalKm;
  const remainingKm = nextDueKm - currentKm;
  const dueSoonKmThreshold = 0.15 * intervalKm;

  // 2. Time-based calculation
  const nextDueDate = new Date(lastDoneDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + intervalMonths);

  const today = new Date();
  const remainingTimeMs = nextDueDate.getTime() - today.getTime();
  const remainingDays = Math.ceil(remainingTimeMs / (1000 * 60 * 60 * 24));
  const dueSoonDaysThreshold = Math.min(30, Math.ceil(0.15 * intervalMonths * 30));

  // 3. Status determination (earliest reached decides)
  let status = MAINTENANCE_STATUS.OK;

  const isDueKm = remainingKm <= 0;
  const isDueSoonKm = remainingKm > 0 && remainingKm <= dueSoonKmThreshold;

  const isDueTime = remainingDays <= 0;
  const isDueSoonTime = remainingDays > 0 && remainingDays <= dueSoonDaysThreshold;

  if (isDueKm || isDueTime) {
    status = MAINTENANCE_STATUS.DUE;
  } else if (isDueSoonKm || isDueSoonTime) {
    status = MAINTENANCE_STATUS.DUE_SOON;
  } else {
    status = MAINTENANCE_STATUS.OK;
  }

  return {
    id: component.id,
    type_id: component.maintenance_type_id || component.type_id || component.id,
    name: component.name || component.type_name,
    description: component.description,
    last_done_km: lastDoneKm,
    last_done_date: lastDoneDate.toISOString().split('T')[0],
    interval_km: intervalKm,
    interval_months: intervalMonths,
    next_due_km: nextDueKm,
    remaining_km: remainingKm,
    next_due_date: nextDueDate.toISOString().split('T')[0],
    remaining_days: remainingDays,
    status,
  };
}

/**
 * Calculates status across all components of a vehicle and derives overall status.
 */
function calculateVehicleStatus(components, currentKm) {
  const evaluatedComponents = components.map((comp) => calculateComponentStatus(comp, currentKm));

  let overallStatus = MAINTENANCE_STATUS.OK;
  for (const comp of evaluatedComponents) {
    if (comp.status === MAINTENANCE_STATUS.DUE) {
      overallStatus = MAINTENANCE_STATUS.DUE;
      break; // DUE is the highest priority
    }
    if (comp.status === MAINTENANCE_STATUS.DUE_SOON) {
      overallStatus = MAINTENANCE_STATUS.DUE_SOON;
    }
  }

  return {
    overallStatus,
    components: evaluatedComponents,
  };
}

module.exports = {
  calculateComponentStatus,
  calculateVehicleStatus,
};
