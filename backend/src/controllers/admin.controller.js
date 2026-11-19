/**
 * Administrator Controller
 * Implements SRS FR-16, FR-41 to FR-44, FR-47.
 */

const pool = require('../config/db');
const AppError = require('../utils/AppError');

// Admin overview dashboard metrics and chart series (FR-41, FR-42, FR-43)
const getDashboardMetrics = async (req, res, next) => {
  try {
    // 1. Core Counts
    const [[userCount]] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const [[vehicleCount]] = await pool.execute('SELECT COUNT(*) as total FROM vehicles');
    const [[bookingCount]] = await pool.execute('SELECT COUNT(*) as total FROM bookings');
    const [[completedCount]] = await pool.execute("SELECT COUNT(*) as total FROM bookings WHERE status = 'COMPLETED'");
    const [[pendingCount]] = await pool.execute("SELECT COUNT(*) as total FROM bookings WHERE status = 'PENDING'");
    const [[acceptedCount]] = await pool.execute("SELECT COUNT(*) as total FROM bookings WHERE status = 'ACCEPTED'");
    const [[inProgressCount]] = await pool.execute("SELECT COUNT(*) as total FROM bookings WHERE status = 'IN_PROGRESS'");
    const [[rejectedCount]] = await pool.execute("SELECT COUNT(*) as total FROM bookings WHERE status = 'REJECTED'");

    // 2. Revenue Metrics (Total and Current Month)
    const [[totalRevRow]] = await pool.execute('SELECT COALESCE(SUM(total_amount), 0) as total FROM bills');
    const [[monthRevRow]] = await pool.execute(
      `SELECT COALESCE(SUM(total_amount), 0) as total 
       FROM bills 
       WHERE MONTH(generated_at) = MONTH(CURRENT_DATE()) 
         AND YEAR(generated_at) = YEAR(CURRENT_DATE())`
    );

    // 3. Monthly Bookings Series (Last 6 months)
    const [monthlyBookings] = await pool.execute(
      `SELECT DATE_FORMAT(booking_date, '%b') as month, 
              COUNT(*) as bookings,
              MIN(booking_date) as sort_date
       FROM bookings 
       WHERE booking_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(booking_date, '%b'), YEAR(booking_date), MONTH(booking_date)
       ORDER BY sort_date ASC`
    );

    // 4. Monthly Revenue Series (Last 6 months)
    const [monthlyRevenue] = await pool.execute(
      `SELECT DATE_FORMAT(generated_at, '%b') as month, 
              COALESCE(SUM(total_amount), 0) as revenue,
              MIN(generated_at) as sort_date
       FROM bills 
       WHERE generated_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY DATE_FORMAT(generated_at, '%b'), YEAR(generated_at), MONTH(generated_at)
       ORDER BY sort_date ASC`
    );

    // 5. Booking Status Distribution
    const bookingStatus = [
      { name: 'Completed', value: completedCount.total },
      { name: 'Pending', value: pendingCount.total },
      { name: 'Accepted', value: acceptedCount.total },
      { name: 'In progress', value: inProgressCount.total },
      { name: 'Rejected', value: rejectedCount.total },
    ];

    // 6. Most Serviced Vehicle Models (FR-43)
    const [topModels] = await pool.execute(
      `SELECT CONCAT(v.brand, ' ', v.model) as model, COUNT(b.id) as count 
       FROM bookings b 
       JOIN vehicles v ON b.vehicle_id = v.id 
       GROUP BY v.brand, v.model 
       ORDER BY count DESC 
       LIMIT 5`
    );

    res.status(200).json({
      dashboard: {
        users: userCount.total,
        vehicles: vehicleCount.total,
        bookings: bookingCount.total,
        completed: completedCount.total,
        pending: pendingCount.total,
        revenue_month: parseFloat(monthRevRow.total),
        revenue_total: parseFloat(totalRevRow.total),
        monthly_bookings: monthlyBookings.map((b) => ({ month: b.month, bookings: b.bookings })),
        monthly_revenue: monthlyRevenue.map((r) => ({ month: r.month, revenue: parseFloat(r.revenue) })),
        booking_status: bookingStatus,
        top_models: topModels,
      },
    });
  } catch (err) {
    next(err);
  }
};

// List users with search (FR-44)
const listUsers = async (req, res, next) => {
  const { search } = req.query;

  try {
    let query = 'SELECT id, name, email, role, phone, is_active, created_at FROM users';
    const params = [];

    if (search && search.trim()) {
      query += ' WHERE name LIKE ? OR email LIKE ?';
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.execute(query, params);
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
};

// Activate / Deactivate user (FR-44)
const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (is_active === undefined) {
    return next(new AppError('is_active status is required.', 400));
  }

  try {
    await pool.execute('UPDATE users SET is_active = ? WHERE id = ?', [Boolean(is_active), id]);
    res.status(200).json({ message: `User account ${is_active ? 'activated' : 'deactivated'} successfully.` });
  } catch (err) {
    next(err);
  }
};

// List all service centers (including pending activation) (FR-44, FR-47)
const listCenters = async (req, res, next) => {
  try {
    const [centers] = await pool.execute(
      `SELECT sc.*, u.name as mechanic_name, u.email as mechanic_email 
       FROM service_centers sc 
       JOIN users u ON sc.user_id = u.id 
       ORDER BY sc.created_at DESC`
    );

    res.status(200).json({ centers });
  } catch (err) {
    next(err);
  }
};

// Create a service center (Admin manual addition)
const createCenter = async (req, res, next) => {
  const { name, address, city, phone, slot_capacity = 2, services_offered } = req.body;

  if (!name || !address || !city || !phone) {
    return next(new AppError('Center name, address, city, and phone are required.', 400));
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO service_centers (user_id, name, address, city, phone, slot_capacity, services_offered, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [req.user.id, name.trim(), address.trim(), city.trim(), phone.trim(), slot_capacity, services_offered || null]
    );

    res.status(201).json({ message: 'Service center created.', id: result.insertId });
  } catch (err) {
    next(err);
  }
};

// Update service center (Approve / Activate / Deactivate) (FR-44, FR-47)
const updateCenter = async (req, res, next) => {
  const { id } = req.params;
  const { is_active, name, address, city, phone, slot_capacity, services_offered } = req.body;

  if (is_active !== undefined && typeof is_active !== 'boolean') {
    return next(new AppError('is_active must be true or false.', 400));
  }

  try {
    if (is_active) {
      const [[owner]] = await pool.execute(
        `SELECT u.email_verified_at FROM service_centers sc
         JOIN users u ON u.id = sc.user_id WHERE sc.id = ?`,
        [id]
      );
      if (owner && !owner.email_verified_at) {
        return next(new AppError('The garage owner must verify their email before approval.', 409));
      }
    }
    const [result] = await pool.execute(
      `UPDATE service_centers 
       SET is_active = COALESCE(?, is_active),
           name = COALESCE(?, name),
           address = COALESCE(?, address),
           city = COALESCE(?, city),
           phone = COALESCE(?, phone),
           slot_capacity = COALESCE(?, slot_capacity),
           services_offered = COALESCE(?, services_offered) 
       WHERE id = ?`,
      [
        is_active ?? null,
        name || null,
        address || null,
        city || null,
        phone || null,
        slot_capacity || null,
        services_offered || null,
        id,
      ]
    );

    if (!result.affectedRows) return next(new AppError('Workshop not found.', 404));
    res.status(200).json({ message: 'Service center updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// List maintenance types & default intervals (FR-16)
const listIntervals = async (req, res, next) => {
  try {
    const [intervals] = await pool.execute(
      'SELECT id, name, description, default_interval_km as interval_km, default_interval_months as interval_months, default_interval_km, default_interval_months, is_active FROM maintenance_types ORDER BY id ASC'
    );
    res.status(200).json({ intervals });
  } catch (err) {
    next(err);
  }
};

// Configure service intervals (FR-16)
const updateInterval = async (req, res, next) => {
  const { id } = req.params;
  const { interval_km, interval_months, default_interval_km, default_interval_months } = req.body;

  const targetKm = interval_km || default_interval_km;
  const targetMonths = interval_months || default_interval_months;

  if (!targetKm && !targetMonths) {
    return next(new AppError('Please provide interval_km or interval_months.', 400));
  }

  try {
    await pool.execute(
      `UPDATE maintenance_types 
       SET default_interval_km = COALESCE(?, default_interval_km),
           default_interval_months = COALESCE(?, default_interval_months) 
       WHERE id = ?`,
      [targetKm ? parseInt(targetKm, 10) : null, targetMonths ? parseInt(targetMonths, 10) : null, id]
    );

    res.status(200).json({ message: 'Component service intervals updated successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardMetrics,
  listUsers,
  updateUser,
  listCenters,
  createCenter,
  updateCenter,
  listIntervals,
  updateInterval,
};
