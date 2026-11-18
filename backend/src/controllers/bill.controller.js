/**
 * Billing & Invoice Controller
 * Implements SRS FR-24, FR-26, FR-27, FR-49.
 */

const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { ROLES } = require('../utils/constants');
const { generateInvoicePdf } = require('../utils/pdfInvoice');

// List bills with role filtering
const listBills = async (req, res, next) => {
  try {
    let query = `
      SELECT bill.*, 
             b.booking_date, b.odometer_at_service,
             v.reg_no, v.brand, v.model,
             sc.name as center_name, sc.city as center_city,
             u.name as owner_name
      FROM bills bill 
      JOIN bookings b ON bill.booking_id = b.id 
      JOIN vehicles v ON b.vehicle_id = v.id 
      JOIN service_centers sc ON b.service_center_id = sc.id 
      JOIN users u ON b.user_id = u.id
    `;
    const params = [];

    if (req.user.role === ROLES.OWNER) {
      query += ' WHERE b.user_id = ? ORDER BY bill.generated_at DESC';
      params.push(req.user.id);
    } else if (req.user.role === ROLES.GARAGE) {
      query += ' WHERE sc.user_id = ? AND sc.is_active = TRUE ORDER BY bill.generated_at DESC';
      params.push(req.user.id);
    } else {
      query += ' ORDER BY bill.generated_at DESC';
    }

    const [bills] = await pool.execute(query, params);
    res.status(200).json({ bills, invoices: bills });
  } catch (err) {
    next(err);
  }
};

// Get single bill details
const getBill = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [bills] = await pool.execute(
      `SELECT bill.*, 
              b.booking_date, b.odometer_at_service, b.mechanic_notes, b.time_slot,
              v.id as vehicle_id, v.reg_no, v.brand, v.model, v.year, v.fuel_type,
              sc.id as service_center_id, sc.name as center_name, sc.address as center_address, sc.city as center_city, sc.phone as center_phone, sc.user_id as mechanic_user_id, sc.is_active as garage_is_active,
              u.id as user_id, u.name as owner_name, u.email as owner_email, u.phone as owner_phone 
       FROM bills bill 
       JOIN bookings b ON bill.booking_id = b.id 
       JOIN vehicles v ON b.vehicle_id = v.id 
       JOIN service_centers sc ON b.service_center_id = sc.id 
       JOIN users u ON b.user_id = u.id 
       WHERE bill.id = ?`,
      [id]
    );

    if (bills.length === 0) return next(new AppError('Bill not found.', 404));
    const bill = bills[0];

    // Role authorization
    if (req.user.role === ROLES.OWNER && bill.user_id !== req.user.id) {
      return next(new AppError('Unauthorized.', 403));
    }
    if (req.user.role === ROLES.GARAGE && (bill.mechanic_user_id !== req.user.id || !bill.garage_is_active)) {
      return next(new AppError('Unauthorized.', 403));
    }

    // Line items
    const [items] = await pool.execute(
      'SELECT id, item_type, description, quantity, unit_price, subtotal FROM job_items WHERE booking_id = ? ORDER BY id ASC',
      [bill.booking_id]
    );

    res.status(200).json({
      bill: {
        ...bill,
        items,
        vehicle: { reg_no: bill.reg_no, brand: bill.brand, model: bill.model, year: bill.year, fuel_type: bill.fuel_type },
        service_center: { name: bill.center_name, address: bill.center_address, city: bill.center_city, phone: bill.center_phone },
        owner: { name: bill.owner_name, email: bill.owner_email, phone: bill.owner_phone },
      },
    });
  } catch (err) {
    next(err);
  }
};

// Download invoice PDF (FR-27)
const downloadPdf = async (req, res, next) => {
  const { id } = req.params;

  try {
    const [bills] = await pool.execute(
      `SELECT bill.*, 
              b.id as booking_id, b.booking_date, b.odometer_at_service, b.mechanic_notes, b.time_slot,
              v.id as vehicle_id, v.reg_no, v.brand, v.model, v.year, v.fuel_type,
              sc.name as center_name, sc.address as center_address, sc.city as center_city, sc.phone as center_phone, sc.user_id as mechanic_user_id, sc.is_active as garage_is_active,
              u.id as user_id, u.name as owner_name, u.email as owner_email, u.phone as owner_phone 
       FROM bills bill 
       JOIN bookings b ON bill.booking_id = b.id 
       JOIN vehicles v ON b.vehicle_id = v.id 
       JOIN service_centers sc ON b.service_center_id = sc.id 
       JOIN users u ON b.user_id = u.id 
       WHERE bill.id = ?`,
      [id]
    );

    if (bills.length === 0) return next(new AppError('Bill not found.', 404));
    const bill = bills[0];

    if (req.user.role === ROLES.OWNER && bill.user_id !== req.user.id) {
      return next(new AppError('Unauthorized to download this invoice.', 403));
    }

    if (req.user.role === ROLES.GARAGE && (bill.mechanic_user_id !== req.user.id || !bill.garage_is_active)) {
      return next(new AppError('This invoice is unavailable to your garage.', 403));
    }

    const [items] = await pool.execute(
      'SELECT item_type, description, quantity, unit_price, subtotal FROM job_items WHERE booking_id = ? ORDER BY id ASC',
      [bill.booking_id]
    );

    const pdfBuffer = await generateInvoicePdf({
      bill,
      booking: {
        id: bill.booking_id,
        odometer_at_service: bill.odometer_at_service,
      },
      items,
      serviceCenter: {
        name: bill.center_name,
        address: bill.center_address,
        city: bill.center_city,
        phone: bill.center_phone,
      },
      vehicle: {
        reg_no: bill.reg_no,
        brand: bill.brand,
        model: bill.model,
        year: bill.year,
        fuel_type: bill.fuel_type,
      },
      user: {
        name: bill.owner_name,
        email: bill.owner_email,
        phone: bill.owner_phone,
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${bill.bill_no || `invoice-${bill.id}`}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listBills,
  getBill,
  downloadPdf,
};
