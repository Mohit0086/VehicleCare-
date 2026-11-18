/**
 * Booking Controller
 * Implements SRS FR-17 to FR-23, FR-47, FR-49 and Guide's feedback:
 * - 2 Users (ADMIN & CUSTOMER)
 * - Improved booking process & slot management
 * - Prompt notification generation on every booking event
 */

const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { BOOKING_STATUS, ROLES, REMINDER_TYPES } = require('../utils/constants');
const { STANDARD_SLOTS, isValidTransition, isSlotAvailable, getSlotAvailability } = require('../services/bookingService');
const { completeJobAndGenerateBill } = require('../services/billingService');
const { createPromptNotification, notifyAdmins } = require('../services/reminderService');

// List bookings with role scoping & status filters
const listBookings = async (req, res, next) => {
  const { status } = req.query;

  try {
    let query = `
      SELECT b.*, 
             v.reg_no, v.brand, v.model, v.current_km as vehicle_current_km,
             sc.name as center_name, sc.address as center_address, sc.city as center_city,
             u.name as owner_name, u.name as customer_name, u.email as owner_email, u.phone as owner_phone,
             bill.id as bill_id, bill.bill_no, bill.total_amount
      FROM bookings b 
      JOIN vehicles v ON b.vehicle_id = v.id 
      LEFT JOIN service_centers sc ON b.service_center_id = sc.id 
      JOIN users u ON b.user_id = u.id 
      LEFT JOIN bills bill ON b.id = bill.booking_id
    `;
    const conditions = [];
    const params = [];

    // Customer sees only their bookings; Admin sees all
    const isCustomer = req.user.role === ROLES.CUSTOMER || req.user.role === 'OWNER';
    if (isCustomer) {
      conditions.push('b.user_id = ?');
      params.push(req.user.id);
    } else if (req.user.role === ROLES.GARAGE) {
      conditions.push('sc.user_id = ? AND sc.is_active = TRUE');
      params.push(req.user.id);
    }

    if (status && status !== 'ALL') {
      conditions.push('b.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY b.booking_date DESC, b.id DESC';

    const [bookings] = await pool.execute(query, params);

    const formatted = bookings.map((b) => ({
      ...b,
      service_center: { name: b.center_name || 'VehicleCare Central Workshop', city: b.center_city || 'Main Center', address: b.center_address || '' },
      vehicle: { reg_no: b.reg_no, brand: b.brand, model: b.model, current_km: b.vehicle_current_km },
      owner: { name: b.owner_name, email: b.owner_email, phone: b.owner_phone },
      customer: { name: b.owner_name, email: b.owner_email, phone: b.owner_phone },
    }));

    res.status(200).json({ bookings: formatted });
  } catch (err) {
    next(err);
  }
};

// Get single booking detail
const getBooking = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.execute(
      `SELECT b.*, 
              v.reg_no, v.brand, v.model, v.current_km as vehicle_current_km, v.fuel_type,
              sc.name as center_name, sc.address as center_address, sc.city as center_city,
              u.name as owner_name, u.name as customer_name, u.email as owner_email, u.phone as owner_phone,
              bill.id as bill_id, bill.bill_no, bill.total_amount, bill.payment_status,
              sc.user_id as garage_owner_id, sc.is_active as garage_is_active
       FROM bookings b 
       JOIN vehicles v ON b.vehicle_id = v.id 
       LEFT JOIN service_centers sc ON b.service_center_id = sc.id 
       JOIN users u ON b.user_id = u.id 
       LEFT JOIN bills bill ON b.id = bill.booking_id 
       WHERE b.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return next(new AppError('Booking not found.', 404));
    }

    const booking = rows[0];

    const isCustomer = req.user.role === ROLES.CUSTOMER || req.user.role === 'OWNER';
    if (isCustomer && booking.user_id !== req.user.id) {
      return next(new AppError('Unauthorized: You do not own this booking.', 403));
    }

    if (req.user.role === ROLES.GARAGE && (booking.garage_owner_id !== req.user.id || !booking.garage_is_active)) {
      return next(new AppError('This booking is unavailable to your garage.', 403));
    }

    // Fetch line items if any
    const [items] = await pool.execute('SELECT * FROM job_items WHERE booking_id = ? ORDER BY id ASC', [id]);

    res.status(200).json({
      booking: {
        ...booking,
        vehicle: { reg_no: booking.reg_no, brand: booking.brand, model: booking.model, current_km: booking.vehicle_current_km, fuel_type: booking.fuel_type },
        owner: { name: booking.owner_name, email: booking.owner_email, phone: booking.owner_phone },
        customer: { name: booking.owner_name, email: booking.owner_email, phone: booking.owner_phone },
        service_center: { name: booking.center_name || 'VehicleCare Central Workshop', city: booking.center_city || 'Main Hub', address: booking.center_address || '' },
        items,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Create a new booking (Improved Booking Process + Prompt Notifications)
const createBooking = async (req, res, next) => {
  let { vehicle_id, service_center_id, booking_date, time_slot, components = [], owner_notes = '' } = req.body;

  if (!Array.isArray(components) || components.some((component) => typeof component !== 'string') || typeof owner_notes !== 'string') {
    return next(new AppError('Enter valid service components and booking notes.', 400));
  }

  if (!vehicle_id || !/^\d{4}-\d{2}-\d{2}$/.test(booking_date) || !STANDARD_SLOTS.includes(time_slot)) {
    return next(new AppError('Vehicle, booking date, and time slot are required.', 400));
  }

  try {
    // 1. Verify vehicle
    const [vehicles] = await pool.execute(
      'SELECT id, user_id, reg_no, brand, model FROM vehicles WHERE id = ?',
      [vehicle_id]
    );
    if (vehicles.length === 0) return next(new AppError('Vehicle not found.', 404));
    const vehicle = vehicles[0];

    const isCustomer = req.user.role === ROLES.CUSTOMER || req.user.role === 'OWNER';
    if (isCustomer && vehicle.user_id !== req.user.id) {
      return next(new AppError('You can only book services for your registered vehicles.', 403));
    }

    // 2. Default service center if not supplied (for simplified 2-user system)
    if (!service_center_id) {
      const [defaultCenters] = await pool.execute('SELECT id FROM service_centers WHERE is_active = TRUE LIMIT 1');
      service_center_id = defaultCenters[0]?.id;
      if (!service_center_id) return next(new AppError('No approved workshops are available.', 409));
    }

    const formattedNotes = components.length > 0
      ? `Requested: ${components.join(', ')}. ${owner_notes}`.trim()
      : owner_notes.trim();

    const connection = await pool.getConnection();
    let bookingId;
    try {
      await connection.beginTransaction();
      const available = await isSlotAvailable(service_center_id, booking_date, time_slot, null, connection);
      if (!available) throw new AppError('The selected workshop slot is full. Please choose another time.', 409);
      const [result] = await connection.execute(
        `INSERT INTO bookings (vehicle_id, service_center_id, user_id, booking_date, time_slot, status, owner_notes)
         VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
        [vehicle_id, service_center_id, req.user.id, booking_date, time_slot, formattedNotes]
      );
      bookingId = result.insertId;
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }

    // 6. PROMPT NOTIFICATION GENERATION (Guide's feature requirement):
    // A. Prompt notification for the customer
    await createPromptNotification({
      userId: req.user.id,
      vehicleId: vehicle.id,
      reminderType: REMINDER_TYPES.BOOKING_UPDATE,
      message: `Appointment request #${bookingId} received. Workshop will inspect ${vehicle.reg_no} on ${booking_date} at ${time_slot}.`,
      dueDate: booking_date,
    });

    const [[center]] = await pool.execute(
      "SELECT u.id FROM service_centers sc JOIN users u ON u.id = sc.user_id WHERE sc.id = ? AND u.role = 'GARAGE' AND u.is_active = TRUE",
      [service_center_id]
    );
    if (center) await createPromptNotification({
      userId: center.id,
      vehicleId: vehicle.id,
      reminderType: REMINDER_TYPES.BOOKING_UPDATE,
      message: `New booking #${bookingId} for ${vehicle.reg_no} on ${booking_date} at ${time_slot}.`,
      dueDate: booking_date,
    });

    // B. Prompt notification for Admin
    await notifyAdmins(
      `New booking request #${bookingId} received from ${req.user.name || 'Customer'} for ${vehicle.reg_no} (${components.join(', ') || 'General Inspection'}).`,
      vehicle.id,
      REMINDER_TYPES.BOOKING_UPDATE
    );

    res.status(201).json({
      message: 'Service appointment booked successfully. Workshop notified.',
      booking: {
        id: bookingId,
        vehicle_id,
        service_center_id,
        booking_date,
        time_slot,
        status: BOOKING_STATUS.PENDING,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Update booking status & workflow transitions (With Prompt Notifications)
const updateBookingStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, mechanic_notes, odometer_at_service, job_items = [], labour_charge = 0, payment_mode } = req.body;

  const isCustomer = req.user.role === ROLES.CUSTOMER;
  const isGarage = req.user.role === ROLES.GARAGE;

  if (isCustomer && status !== 'CANCELLED') {
    return next(new AppError('Customers can only cancel their own pending bookings.', 403));
  }

  if (isGarage && status === 'CANCELLED') {
    return next(new AppError('Use Decline to reject a workshop booking.', 403));
  }

  if (!status) {
    return next(new AppError('Status is required.', 400));
  }

  try {
    const [bookings] = await pool.execute(
      `SELECT b.*, v.reg_no, v.brand, v.model, u.id as customer_id, u.name as customer_name, sc.user_id as garage_owner_id, sc.is_active as garage_is_active
       FROM bookings b 
       JOIN vehicles v ON b.vehicle_id = v.id 
       JOIN users u ON b.user_id = u.id
       JOIN service_centers sc ON b.service_center_id = sc.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookings.length === 0) return next(new AppError('Booking not found.', 404));
    const booking = bookings[0];

    if (isGarage && (booking.garage_owner_id !== req.user.id || !booking.garage_is_active)) {
      return next(new AppError('This booking is unavailable to your garage.', 403));
    }

    // Customer cancellation
    if (status === 'CANCELLED') {
      if (isCustomer && booking.user_id !== req.user.id) {
        return next(new AppError('Unauthorized.', 403));
      }
      if (booking.status !== BOOKING_STATUS.PENDING) {
        return next(new AppError('Only PENDING bookings can be cancelled.', 400));
      }

      const [result] = await pool.execute(
        'UPDATE bookings SET status = ? WHERE id = ? AND status = ?',
        [BOOKING_STATUS.REJECTED, id, BOOKING_STATUS.PENDING]
      );
      if (!result.affectedRows) return next(new AppError('This booking has changed. Refresh and try again.', 409));

      // Prompt notification for Admin
      await notifyAdmins(`Booking #${booking.id} was cancelled by customer ${booking.customer_name}.`, booking.vehicle_id);

      return res.status(200).json({ message: 'Booking cancelled successfully.' });
    }

    // Validate state machine transition
    if (!isValidTransition(booking.status, status)) {
      return next(new AppError(`Invalid status transition from ${booking.status} to ${status}.`, 400));
    }

    // If completing job -> run transactional bill generation and component sync
    if (status === BOOKING_STATUS.COMPLETED) {
      const completionResult = await completeJobAndGenerateBill({
        bookingId: id,
        mechanicUserId: req.user.id,
        garageOwnerId: isGarage ? req.user.id : null,
        odometerAtService: odometer_at_service || booking.odometer_at_service,
        mechanicNotes: mechanic_notes,
        jobItems: job_items,
        labourCharge: labour_charge,
        paymentMode: payment_mode || 'CASH',
      });

      // Prompt Notification for Customer upon completion
      await createPromptNotification({
        userId: booking.customer_id,
        vehicleId: booking.vehicle_id,
        reminderType: REMINDER_TYPES.INVOICE_GENERATED,
        message: `Service completed for ${booking.reg_no}! Invoice #${completionResult.billNo} generated for ₹${completionResult.totalAmount.toLocaleString('en-IN')}. Download your invoice.`,
      });

      return res.status(200).json({
        message: 'Job completed and bill generated successfully.',
        ...completionResult,
      });
    }

    // Standard intermediate state update (ACCEPTED, IN_PROGRESS, REJECTED)
    const garageScope = isGarage ? ' AND sc.user_id = ? AND sc.is_active = TRUE' : '';
    const params = [status, mechanic_notes ? mechanic_notes.trim() : null, id, booking.status];
    if (isGarage) params.push(req.user.id);
    const [result] = await pool.execute(
      `UPDATE bookings b JOIN service_centers sc ON sc.id = b.service_center_id
       SET b.status = ?, b.mechanic_notes = COALESCE(?, b.mechanic_notes)
       WHERE b.id = ? AND b.status = ?${garageScope}`,
      params
    );
    if (!result.affectedRows) return next(new AppError('This booking has changed. Refresh and try again.', 409));

    // Prompt Notification for Customer on status changes
    let alertMsg = '';
    if (status === BOOKING_STATUS.ACCEPTED) {
      alertMsg = `Good news! Your booking #${booking.id} for ${booking.reg_no} has been ACCEPTED by the workshop.`;
    } else if (status === BOOKING_STATUS.IN_PROGRESS) {
      alertMsg = `Service is now IN PROGRESS for vehicle ${booking.reg_no} (Booking #${booking.id}).`;
    } else if (status === BOOKING_STATUS.REJECTED) {
      alertMsg = `Booking #${booking.id} for ${booking.reg_no} was declined. ${mechanic_notes ? `Reason: ${mechanic_notes}` : ''}`.trim();
    }

    if (alertMsg) {
      await createPromptNotification({
        userId: booking.customer_id,
        vehicleId: booking.vehicle_id,
        reminderType: REMINDER_TYPES.BOOKING_UPDATE,
        message: alertMsg,
      });
    }

    res.status(200).json({
      message: `Booking updated to ${status}. Customer notified.`,
      status,
    });
  } catch (err) {
    next(err);
  }
};

// Check slot availability for center on date
const getSlots = async (req, res, next) => {
  let { service_center_id, booking_date } = req.query;

  if (!booking_date) {
    return next(new AppError('booking_date is required.', 400));
  }

  try {
    if (!service_center_id) {
      const [centers] = await pool.execute('SELECT id FROM service_centers WHERE is_active = TRUE LIMIT 1');
      service_center_id = centers[0]?.id;
      if (!service_center_id) return res.json({ slots: [] });
    }

    const slots = await getSlotAvailability(service_center_id, booking_date);
    res.status(200).json({ slots });
  } catch (err) {
    next(err);
  }
};

// List available service centers
const listServiceCenters = async (req, res, next) => {
  try {
    const [centers] = await pool.execute(
      'SELECT id, name, address, city, phone, services_offered, slot_capacity, is_active FROM service_centers WHERE is_active = TRUE ORDER BY name ASC'
    );
    res.status(200).json({ centers, service_centers: centers });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listBookings,
  getBooking,
  createBooking,
  updateBookingStatus,
  getSlots,
  listServiceCenters,
};
