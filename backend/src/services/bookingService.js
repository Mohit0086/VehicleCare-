/**
 * Booking Workflow & Slot Management Service
 * Implements SRS FR-17 to FR-21, FR-23, and state machine transitions.
 */

const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { BOOKING_STATUS } = require('../utils/constants');

const STANDARD_SLOTS = [
  '09:00-11:00',
  '11:00-13:00',
  '14:00-16:00',
  '16:00-18:00',
];

// Valid state machine transitions (SRS 4.2)
const VALID_TRANSITIONS = {
  [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.REJECTED, 'CANCELLED'],
  [BOOKING_STATUS.ACCEPTED]: [BOOKING_STATUS.IN_PROGRESS],
  [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED],
  [BOOKING_STATUS.COMPLETED]: [],
  [BOOKING_STATUS.REJECTED]: [],
};

/**
 * Validates whether state transition is allowed.
 */
function isValidTransition(currentStatus, newStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed && allowed.includes(newStatus);
}

/**
 * Checks if a slot has reached maximum workshop capacity (FR-18).
 */
async function isSlotAvailable(serviceCenterId, bookingDate, timeSlot, excludeBookingId = null, connection = pool) {
  // 1. Fetch center slot capacity
  const [centers] = await connection.execute(
    'SELECT slot_capacity FROM service_centers WHERE id = ? AND is_active = TRUE FOR UPDATE',
    [serviceCenterId]
  );

  if (centers.length === 0) {
    throw new AppError('Service center not found.', 404);
  }

  const capacity = centers[0].slot_capacity || 2;

  // 2. Count active bookings in this slot
  let query = `
    SELECT COUNT(*) as count 
    FROM bookings 
    WHERE service_center_id = ? 
      AND booking_date = ? 
      AND time_slot = ? 
      AND status NOT IN ('REJECTED', 'COMPLETED')
  `;
  const params = [serviceCenterId, bookingDate, timeSlot];

  if (excludeBookingId) {
    query += ' AND id != ?';
    params.push(excludeBookingId);
  }

  const [rows] = await connection.execute(query, params);
  const currentCount = rows[0].count;

  return currentCount < capacity;
}

/**
 * Lists slot availability for a service center on a given date.
 */
async function getSlotAvailability(serviceCenterId, bookingDate) {
  const [centers] = await pool.execute(
    'SELECT slot_capacity FROM service_centers WHERE id = ? AND is_active = TRUE',
    [serviceCenterId]
  );

  if (centers.length === 0) {
    throw new AppError('Service center not found.', 404);
  }

  const capacity = centers[0].slot_capacity || 2;

  const [bookedRows] = await pool.execute(
    `SELECT time_slot, COUNT(*) as count 
     FROM bookings 
     WHERE service_center_id = ? 
       AND booking_date = ? 
       AND status NOT IN ('REJECTED', 'COMPLETED') 
     GROUP BY time_slot`,
    [serviceCenterId, bookingDate]
  );

  const counts = {};
  bookedRows.forEach((r) => {
    counts[r.time_slot] = r.count;
  });

  return STANDARD_SLOTS.map((slot) => {
    const booked = counts[slot] || 0;
    const available = booked < capacity;
    return {
      time_slot: slot,
      available,
      remaining_capacity: Math.max(0, capacity - booked),
      total_capacity: capacity,
    };
  });
}

module.exports = {
  STANDARD_SLOTS,
  isValidTransition,
  isSlotAvailable,
  getSlotAvailability,
};
