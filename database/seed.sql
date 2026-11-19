-- =====================================================================
-- VehicleCare Seed Data
-- Version: 1.1 (Supports FR-1 through FR-49)
-- =====================================================================

USE vehiclecare_db;

-- 1. SEED MAINTENANCE TYPES (8 Core Tracked Components - FR-11)
INSERT INTO maintenance_types (id, name, description, default_interval_km, default_interval_months, is_active)
VALUES
    (1, 'Engine Oil', 'Engine oil and filter replacement', 10000, 6, TRUE),
    (2, 'Brakes', 'Brake pad and disc inspection & replacement', 15000, 12, TRUE),
    (3, 'Tyres', 'Tyre rotation, tread depth check and wheel alignment', 40000, 36, TRUE),
    (4, 'Battery', 'Battery health and terminal voltage inspection', 50000, 24, TRUE),
    (5, 'Air Filter', 'Cabin and engine air intake filter cleaning/replacement', 15000, 12, TRUE),
    (6, 'Coolant', 'Engine radiator coolant level and flush', 30000, 24, TRUE),
    (7, 'Air Conditioner', 'AC refrigerant gas pressure and compressor check', 20000, 12, TRUE),
    (8, 'General Service', 'Comprehensive 40-point vehicle checkup and tuning', 10000, 12, TRUE)
ON DUPLICATE KEY UPDATE 
    description = VALUES(description),
    default_interval_km = VALUES(default_interval_km),
    default_interval_months = VALUES(default_interval_months),
    is_active = VALUES(is_active);

-- 2. SEED USERS (Two Roles: ADMIN and CUSTOMER; Password: Admin@123 / Customer@123)
INSERT INTO users (id, name, email, password_hash, role, phone, is_active)
VALUES
    (1, 'System Administrator', 'admin@vehiclecare.com', '$2b$10$enkI7aKVUpaRk1sHZXR0GO6DnDGpPMWaDg60YaMe0y/9JA9zRlehi', 'ADMIN', '9876543210', TRUE),
    (2, 'Mohit Sharma (Customer)', 'customer@vehiclecare.com', '$2b$10$ymfUeITV5l7HTDt44Vyoh.CFEVJdG7ms5tM5plhk7qTTdaHQ0q6ty', 'CUSTOMER', '9876543211', TRUE),
    (3, 'Aarav Patel (Customer 2)', 'owner@example.com', '$2b$10$ymfUeITV5l7HTDt44Vyoh.CFEVJdG7ms5tM5plhk7qTTdaHQ0q6ty', 'CUSTOMER', '9876543212', TRUE)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    role = VALUES(role),
    phone = VALUES(phone),
    is_active = VALUES(is_active);

-- 3. SEED SERVICE CENTER (VehicleCare Central Workshop operated by Admin)
INSERT INTO service_centers (id, user_id, name, address, city, phone, services_offered, slot_capacity, is_active)
VALUES
    (1, 1, 'VehicleCare Central Workshop', 'Plot 42, Industrial Area, Sector 5', 'Bhopal', '9876543210', 'Engine Oil, Brakes, AC, Battery, Coolant, Tyres, General Service', 4, TRUE)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    address = VALUES(address),
    city = VALUES(city),
    phone = VALUES(phone),
    services_offered = VALUES(services_offered),
    slot_capacity = VALUES(slot_capacity),
    is_active = VALUES(is_active);

-- 4. SEED SAMPLE VEHICLES (Owned by user id: 3)
INSERT INTO vehicles (id, user_id, reg_no, brand, model, year, fuel_type, current_km, insurance_expiry, puc_expiry)
VALUES
    (1, 3, 'RJ14-AB-1234', 'Hyundai', 'Creta', 2022, 'PETROL', 18500, DATE_ADD(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY)),
    (2, 3, 'MH12-CD-5678', 'Tata', 'Nexon EV', 2024, 'ELECTRIC', 8200, DATE_ADD(CURDATE(), INTERVAL 180 DAY), DATE_ADD(CURDATE(), INTERVAL 90 DAY))
ON DUPLICATE KEY UPDATE 
    current_km = VALUES(current_km),
    insurance_expiry = VALUES(insurance_expiry),
    puc_expiry = VALUES(puc_expiry);

-- 5. SEED ODOMETER LOGS (Audit log - FR-9, FR-10)
INSERT INTO odometer_logs (vehicle_id, reading_km, recorded_by_user_id, source, notes, recorded_at)
VALUES
    (1, 0, 3, 'OWNER_UPDATE', 'Baseline vehicle addition reading', DATE_SUB(CURDATE(), INTERVAL 18 MONTH)),
    (1, 10000, 2, 'MECHANIC_SERVICE', '10,000 km regular service visit', DATE_SUB(CURDATE(), INTERVAL 4 MONTH)),
    (1, 18500, 3, 'OWNER_UPDATE', 'Routine odometer update by owner', CURDATE()),
    (2, 0, 3, 'OWNER_UPDATE', 'Baseline vehicle addition reading', DATE_SUB(CURDATE(), INTERVAL 6 MONTH)),
    (2, 8200, 3, 'OWNER_UPDATE', 'Routine odometer update by owner', CURDATE())
ON DUPLICATE KEY UPDATE reading_km = VALUES(reading_km);

-- 6. SEED VEHICLE MAINTENANCE (Component Tracking & Baseline - FR-12, FR-13, FR-48)
-- For Vehicle 1 (Creta, 18500 km)
INSERT INTO vehicle_maintenance (vehicle_id, maintenance_type_id, last_done_km, last_done_date, interval_km, interval_months)
VALUES
    (1, 1, 10000, DATE_SUB(CURDATE(), INTERVAL 4 MONTH), 10000, 6),
    (1, 2, 10000, DATE_SUB(CURDATE(), INTERVAL 4 MONTH), 15000, 12),
    (1, 3, 0, DATE_SUB(CURDATE(), INTERVAL 18 MONTH), 40000, 36),
    (1, 4, 0, DATE_SUB(CURDATE(), INTERVAL 18 MONTH), 50000, 24),
    (1, 5, 10000, DATE_SUB(CURDATE(), INTERVAL 4 MONTH), 15000, 12),
    (1, 6, 0, DATE_SUB(CURDATE(), INTERVAL 18 MONTH), 30000, 24),
    (1, 7, 0, DATE_SUB(CURDATE(), INTERVAL 18 MONTH), 20000, 12),
    (1, 8, 10000, DATE_SUB(CURDATE(), INTERVAL 4 MONTH), 10000, 12),
    -- For Vehicle 2 (Nexon EV, 8200 km)
    (2, 1, 0, DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 10000, 6),
    (2, 2, 0, DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 15000, 12),
    (2, 3, 0, DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 40000, 36),
    (2, 4, 0, DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 50000, 24),
    (2, 5, 0, DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 15000, 12),
    (2, 6, 0, DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 30000, 24),
    (2, 7, 0, DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 20000, 12),
    (2, 8, 0, DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 10000, 12)
ON DUPLICATE KEY UPDATE 
    last_done_km = VALUES(last_done_km),
    last_done_date = VALUES(last_done_date);

-- 7. SEED BOOKINGS (FR-17, FR-20)
INSERT INTO bookings (id, vehicle_id, service_center_id, user_id, booking_date, time_slot, status, owner_notes, mechanic_notes, odometer_at_service)
VALUES
    (1, 1, 1, 3, DATE_SUB(CURDATE(), INTERVAL 120 DAY), '10:00-12:00', 'COMPLETED', 'Regular 10k service and oil change', 'Service completed smoothly. Brake pads inspected, oil & filter changed.', 10000),
    (2, 1, 1, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:00-16:00', 'ACCEPTED', 'Engine oil and air filter inspection', 'Job accepted by the workshop.', NULL),
    (3, 2, 1, 3, DATE_ADD(CURDATE(), INTERVAL 5 DAY), '09:00-11:00', 'PENDING', 'Tyre pressure check and routine alignment check', NULL, NULL)
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- 8. SEED JOB ITEMS (FR-22) for Booking 1
INSERT INTO job_items (id, booking_id, item_type, description, quantity, unit_price)
VALUES
    (1, 1, 'PART', 'Engine Oil (Synthetic 5W-30 4L)', 1.00, 2800.00),
    (2, 1, 'PART', 'Engine Oil Filter Cartridge', 1.00, 450.00),
    (3, 1, 'PART', 'Air Filter Replacement Element', 1.00, 650.00),
    (4, 1, 'LABOUR', 'Standard Periodic Maintenance Labour', 1.00, 1500.00)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 9. SEED BILL (FR-24, FR-25) for Booking 1
INSERT INTO bills (id, booking_id, bill_no, total_amount, payment_status, payment_mode, generated_at)
VALUES
    (1, 1, 'VC-2026-0001', 5400.00, 'PAID', 'UPI', DATE_SUB(CURDATE(), INTERVAL 120 DAY))
ON DUPLICATE KEY UPDATE total_amount = VALUES(total_amount);

-- 10. SEED REMINDERS (FR-30, FR-31, FR-33)
INSERT INTO reminders (id, user_id, vehicle_id, reminder_type, message, status, due_date, created_at)
VALUES
    (1, 3, 1, 'MAINTENANCE_DUE_SOON', 'Engine oil service is due soon for RJ14-AB-1234 (1,500 km remaining).', 'UNREAD', CURDATE(), NOW()),
    (2, 3, 1, 'PUC_EXPIRY', 'PUC certificate expires in 20 days for RJ14-AB-1234.', 'UNREAD', DATE_ADD(CURDATE(), INTERVAL 20 DAY), NOW()),
    (3, 3, 1, 'MAINTENANCE_DUE', 'General Service is due for RJ14-AB-1234.', 'READ', CURDATE(), DATE_SUB(CURDATE(), INTERVAL 5 DAY))
ON DUPLICATE KEY UPDATE message = VALUES(message);
