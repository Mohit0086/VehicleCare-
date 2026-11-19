/**
 * Billing & Job Completion Service
 * Implements SRS FR-21, FR-22, FR-24, FR-25 and transactional data integrity (3.4.3).
 */

const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { BOOKING_STATUS } = require('../utils/constants');

const MAX_AMOUNT = 99999999.99;
function parseDecimal(value, max) {
  if (!['string', 'number'].includes(typeof value) || !/^\d+(?:\.\d{1,2})?$/.test(String(value).trim())) return NaN;
  const number = Number(value);
  return number <= max ? number : NaN;
}

/**
 * Completes a service booking atomically within a database transaction.
 */
async function completeJobAndGenerateBill({
  bookingId,
  mechanicUserId,
  garageOwnerId = null,
  odometerAtService,
  mechanicNotes,
  jobItems = [],
  labourCharge = 0,
  paymentMode = 'CASH',
  servicedTypeIds = [],
}) {
  if (!Array.isArray(jobItems) || !['CASH', 'UPI', 'CARD'].includes(paymentMode)) {
    throw new AppError('Enter valid invoice items and payment method.', 400);
  }
  const labour = parseDecimal(labourCharge, MAX_AMOUNT);
  if (!Number.isFinite(labour)) throw new AppError('Enter a non-negative labour charge with up to two decimal places.', 400);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch booking with lock
    const [bookings] = await connection.execute(
      `SELECT b.*, v.current_km as vehicle_current_km, v.id as vehicle_id, sc.user_id as center_mechanic_id, sc.is_active as garage_is_active 
       FROM bookings b 
       JOIN vehicles v ON b.vehicle_id = v.id 
       JOIN service_centers sc ON b.service_center_id = sc.id 
       WHERE b.id = ? FOR UPDATE`,
      [bookingId]
    );

    if (bookings.length === 0) {
      throw new AppError('Booking not found.', 404);
    }

    const booking = bookings[0];

    if (garageOwnerId && (booking.center_mechanic_id !== garageOwnerId || !booking.garage_is_active)) {
      throw new AppError('This booking is unavailable to your garage.', 403);
    }

    // Ensure booking is in IN_PROGRESS
    if (booking.status !== BOOKING_STATUS.IN_PROGRESS) {
      throw new AppError(`Cannot complete booking in status: ${booking.status}. Must be IN_PROGRESS.`, 400);
    }

    // 2. Validate odometer reading (mechanic reading cannot decrease vehicle km - FR-9, 4.3)
    const serviceKm = parseDecimal(odometerAtService, 4294967295);
    if (!Number.isInteger(serviceKm) || serviceKm < booking.vehicle_current_km) {
      throw new AppError(
        `Odometer reading at service (${serviceKm} km) cannot be lower than the current vehicle reading (${booking.vehicle_current_km} km).`,
        400
      );
    }

    // 3. Process Job Items
    // Alternate flow in UC-6: if no items are added, at least one item or labour is required.
    const itemsToInsert = [...jobItems];
    if (labour > 0) {
      itemsToInsert.push({
        item_type: 'LABOUR',
        description: 'Workshop Labour Charge',
        quantity: 1,
        unit_price: labour,
      });
    }

    if (itemsToInsert.length === 0) {
      throw new AppError('At least one part or labour charge item is required to complete the job and generate a bill.', 400);
    }

    for (const item of itemsToInsert) {
      const qty = parseDecimal(item?.quantity ?? 1, 9999.99);
      const price = parseDecimal(item?.unit_price, MAX_AMOUNT);
      const type = item?.item_type === 'LABOUR' ? 'LABOUR' : 'PART';
      const desc = typeof item?.description === 'string' ? item.description.trim() : '';
      if (!(qty > 0) || !Number.isFinite(price) || qty * price > MAX_AMOUNT || !desc || desc.length > 255) {
        throw new AppError('Each invoice item needs a description, positive quantity, and a valid non-negative price.', 400);
      }

      await connection.execute(
        'INSERT INTO job_items (booking_id, item_type, description, quantity, unit_price) VALUES (?, ?, ?, ?, ?)',
        [bookingId, type, desc, qty, price]
      );
    }

    const [[totals]] = await connection.execute(
      'SELECT SUM(subtotal) AS total FROM job_items WHERE booking_id = ?',
      [bookingId]
    );
    const calculatedTotal = Number(totals.total);
    if (calculatedTotal > MAX_AMOUNT) throw new AppError('The invoice total is too large.', 400);

    // 4. Generate Unique Bill Number
    const year = new Date().getFullYear();
    const billNo = `VC-${year}-${String(bookingId).padStart(4, '0')}`;

    // 5. Insert Bill Record (FR-24)
    const [billResult] = await connection.execute(
      'INSERT INTO bills (booking_id, bill_no, total_amount, payment_status, payment_mode) VALUES (?, ?, ?, ?, ?)',
      [bookingId, billNo, calculatedTotal, 'PAID', paymentMode]
    );

    // 6. Update Vehicle Odometer (FR-25)
    await connection.execute(
      'UPDATE vehicles SET current_km = ? WHERE id = ?',
      [serviceKm, booking.vehicle_id]
    );

    // 7. Audit log in odometer_logs (FR-10)
    await connection.execute(
      'INSERT INTO odometer_logs (vehicle_id, reading_km, recorded_by_user_id, source, notes) VALUES (?, ?, ?, ?, ?)',
      [booking.vehicle_id, serviceKm, mechanicUserId, 'MECHANIC_SERVICE', `Logged from completed service booking #${bookingId}`]
    );

    // 8. Update Component Maintenance Records (FR-25)
    // Use confirmed service IDs or descriptions from the garage's billed work.
    const [mTypes] = await connection.execute('SELECT id, name FROM maintenance_types WHERE is_active = TRUE');
    const touchedTypeIds = new Set();
    const confirmedIds = new Set(servicedTypeIds.map(Number));
    const confirmedItems = itemsToInsert.map((item) => (item.description || '').toLowerCase());

    for (const type of mTypes) {
      const name = type.name.toLowerCase().replace(/s$/, '');
      if (confirmedIds.has(type.id) || confirmedItems.some((description) => description.includes(name))) {
        touchedTypeIds.add(type.id);
      }
    }

    // Update last_done_km and last_done_date for touched components (portable across MySQL & SQLite)
    for (const typeId of touchedTypeIds) {
      const [existing] = await connection.execute(
        'SELECT id FROM vehicle_maintenance WHERE vehicle_id = ? AND maintenance_type_id = ?',
        [booking.vehicle_id, typeId]
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE vehicle_maintenance SET last_done_km = ?, last_done_date = CURDATE() WHERE id = ?',
          [serviceKm, existing[0].id]
        );
      } else {
        await connection.execute(
          `INSERT INTO vehicle_maintenance (vehicle_id, maintenance_type_id, last_done_km, last_done_date, interval_km, interval_months)
           SELECT ?, mt.id, ?, CURDATE(), mt.default_interval_km, mt.default_interval_months
           FROM maintenance_types mt WHERE mt.id = ?`,
          [booking.vehicle_id, serviceKm, typeId]
        );
      }
    }

    // 9. Update Booking status to COMPLETED
    await connection.execute(
      'UPDATE bookings SET status = ?, odometer_at_service = ?, mechanic_notes = ? WHERE id = ?',
      [BOOKING_STATUS.COMPLETED, serviceKm, mechanicNotes ? mechanicNotes.trim() : null, bookingId]
    );

    await connection.commit();

    return {
      success: true,
      bookingId,
      billId: billResult.insertId,
      billNo,
      totalAmount: calculatedTotal,
      serviceKm,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  completeJobAndGenerateBill,
};
