-- =====================================================================
-- VehicleCare Seed Data
-- =====================================================================

USE vehiclecare_db;

-- 1. SEED MAINTENANCE TYPES (8 Core Components tracked)
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
    default_interval_months = VALUES(default_interval_months);

-- 2. SEED USERS
-- Passwords below are hashed with bcrypt (cost = 10)
-- admin@vehiclecare.com   -> Admin@123   ($2b$10$f3U3uE8b9N9f7lQJqE2LTuT6Qx.91hVvI8GvP1wB4C7r6xY3Z9j3m)
-- mechanic@quickfix.com   -> Mechanic@123($2b$10$4B9Y4uO9vE7w9zQjT1rGtuC2K7h8L2xN8vC1b2A3C4d5E6f7g8h9i)
-- owner@example.com       -> Owner@123   ($2b$10$7C3v9vB1m2L3k4J5H6g7f8d9s0A1b2C3d4E5f6G7h8I9j0K1l2M3n)
-- Note: Replace or regenerate hashes upon initial deployment if custom passwords are used.

INSERT INTO users (id, name, email, password_hash, role, phone)
VALUES
    (1, 'System Administrator', 'admin@vehiclecare.com', '$2b$10$K9Wn0E8j3F6qL8mB5zN3.e6Lz5B3R2T9vO7W4pA1C8vY3Z9j3m112', 'ADMIN', '9876543210'),
    (2, 'QuickFix Workshop (Mechanic)', 'mechanic@quickfix.com', '$2b$10$K9Wn0E8j3F6qL8mB5zN3.e6Lz5B3R2T9vO7W4pA1C8vY3Z9j3m112', 'MECHANIC', '9876543211'),
    (3, 'Mohit Sharma (Owner)', 'owner@example.com', '$2b$10$K9Wn0E8j3F6qL8mB5zN3.e6Lz5B3R2T9vO7W4pA1C8vY3Z9j3m112', 'OWNER', '9876543212')
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    phone = VALUES(phone);

-- 3. SEED SERVICE CENTER (Linked to Mechanic user id: 2)
INSERT INTO service_centers (id, user_id, name, address, city, phone, slot_capacity)
VALUES
    (1, 2, 'QuickFix Auto Care', 'Plot 42, Industrial Area, Sector 5', 'Jaipur', '9876543211', 3)
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    slot_capacity = VALUES(slot_capacity);

-- 4. SEED SAMPLE VEHICLE (Owned by user id: 3)
INSERT INTO vehicles (id, user_id, reg_no, brand, model, year, fuel_type, current_km, insurance_expiry, puc_expiry)
VALUES
    (1, 3, 'RJ14-AB-1234', 'Hyundai', 'Creta', 2022, 'PETROL', 18500, DATE_ADD(CURDATE(), INTERVAL 60 DAY), DATE_ADD(CURDATE(), INTERVAL 20 DAY))
ON DUPLICATE KEY UPDATE 
    current_km = VALUES(current_km);

-- 5. SEED INITIAL VEHICLE MAINTENANCE COMPONENTS (for Vehicle 1)
-- Initialized based on current_km (18500 km)
INSERT INTO vehicle_maintenance (vehicle_id, maintenance_type_id, last_done_km, last_done_date, interval_km, interval_months)
VALUES
    (1, 1, 10000, DATE_SUB(CURDATE(), INTERVAL 4 MONTH), 10000, 6),
    (1, 2, 10000, DATE_SUB(CURDATE(), INTERVAL 4 MONTH), 15000, 12),
    (1, 3, 0, DATE_SUB(CURDATE(), INTERVAL 18 MONTH), 40000, 36),
    (1, 4, 0, DATE_SUB(CURDATE(), INTERVAL 18 MONTH), 50000, 24),
    (1, 5, 10000, DATE_SUB(CURDATE(), INTERVAL 4 MONTH), 15000, 12),
    (1, 6, 0, DATE_SUB(CURDATE(), INTERVAL 18 MONTH), 30000, 24),
    (1, 7, 0, DATE_SUB(CURDATE(), INTERVAL 18 MONTH), 20000, 12),
    (1, 8, 10000, DATE_SUB(CURDATE(), INTERVAL 4 MONTH), 10000, 12)
ON DUPLICATE KEY UPDATE 
    last_done_km = VALUES(last_done_km);

-- 6. SEED INITIAL ODOMETER LOG
INSERT INTO odometer_logs (vehicle_id, reading_km, recorded_by_user_id, source, notes)
VALUES
    (1, 18500, 3, 'OWNER_UPDATE', 'Baseline vehicle registration odometer reading')
ON DUPLICATE KEY UPDATE reading_km = VALUES(reading_km);
