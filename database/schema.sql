-- =====================================================================
-- VehicleCare Database Schema
-- Standard: MySQL 8.0+ / 3NF Normalized
-- =====================================================================

CREATE DATABASE IF NOT EXISTS vehiclecare_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vehiclecare_db;

-- 1. USERS TABLE
-- Handles authentication and role-based access (OWNER, MECHANIC, ADMIN)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('OWNER', 'MECHANIC', 'ADMIN') NOT NULL DEFAULT 'OWNER',
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- 2. SERVICE CENTERS TABLE
-- 1:1 business profile tied to a MECHANIC user account.
-- Includes slot_capacity to prevent workshop slot over-booking.
CREATE TABLE IF NOT EXISTS service_centers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    slot_capacity INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_centers_city (city)
) ENGINE=InnoDB;

-- 3. VEHICLES TABLE
-- Belongs to an OWNER user. Tracks current odometer and legal compliance expiries.
CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reg_no VARCHAR(20) NOT NULL UNIQUE,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    fuel_type ENUM('PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID') NOT NULL,
    current_km INT UNSIGNED NOT NULL DEFAULT 0,
    insurance_expiry DATE NULL,
    puc_expiry DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_vehicles_owner (user_id),
    INDEX idx_vehicles_reg (reg_no)
) ENGINE=InnoDB;

-- 4. ODOMETER LOGS TABLE
-- Immutable audit log: guarantees odometer monotonicity and tamper-evidence.
CREATE TABLE IF NOT EXISTS odometer_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    reading_km INT UNSIGNED NOT NULL,
    recorded_by_user_id INT NOT NULL,
    source ENUM('OWNER_UPDATE', 'MECHANIC_SERVICE') NOT NULL,
    notes VARCHAR(255) NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_odo_vehicle (vehicle_id, recorded_at DESC)
) ENGINE=InnoDB;

-- 5. MAINTENANCE TYPES TABLE
-- Standard catalog of components tracked (engine oil, brakes, etc.) with default intervals.
CREATE TABLE IF NOT EXISTS maintenance_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255) NULL,
    default_interval_km INT UNSIGNED NOT NULL,
    default_interval_months INT UNSIGNED NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. VEHICLE MAINTENANCE TABLE
-- Junction table linking each vehicle to its tracked components and service history.
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    maintenance_type_id INT NOT NULL,
    last_done_km INT UNSIGNED NOT NULL DEFAULT 0,
    last_done_date DATE NOT NULL,
    interval_km INT UNSIGNED NOT NULL,
    interval_months INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_vehicle_component (vehicle_id, maintenance_type_id),
    INDEX idx_vm_vehicle (vehicle_id)
) ENGINE=InnoDB;

-- 7. BOOKINGS TABLE
-- State machine: PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED (or REJECTED from PENDING)
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    service_center_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    owner_notes TEXT NULL,
    mechanic_notes TEXT NULL,
    odometer_at_service INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (service_center_id) REFERENCES service_centers(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_bookings_slot (service_center_id, booking_date, time_slot),
    INDEX idx_bookings_user (user_id),
    INDEX idx_bookings_status (status)
) ENGINE=InnoDB;

-- 8. JOB ITEMS TABLE
-- Detailed parts and labour line items recorded by mechanic during service.
CREATE TABLE IF NOT EXISTS job_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    item_type ENUM('PART', 'LABOUR') NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(6, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_job_booking (booking_id)
) ENGINE=InnoDB;

-- 9. BILLS TABLE
-- Invoice record generated atomically upon booking completion.
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    bill_no VARCHAR(50) NOT NULL UNIQUE,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('PAID', 'PENDING') NOT NULL DEFAULT 'PAID',
    payment_mode ENUM('CASH', 'UPI', 'CARD') NOT NULL DEFAULT 'CASH',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    INDEX idx_bills_billno (bill_no)
) ENGINE=InnoDB;

-- 10. DOCUMENTS TABLE
-- Uploaded vehicle documents (RC, Insurance, PUC) handled via Multer.
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT NOT NULL,
    doc_type ENUM('RC', 'INSURANCE', 'PUC', 'OTHER') NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    expiry_date DATE NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    INDEX idx_docs_vehicle (vehicle_id)
) ENGINE=InnoDB;

-- 11. REMINDERS TABLE
-- In-app notifications generated by daily node-cron job.
CREATE TABLE IF NOT EXISTS reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_id INT NULL,
    reminder_type ENUM('MAINTENANCE_DUE', 'MAINTENANCE_DUE_SOON', 'INSURANCE_EXPIRY', 'PUC_EXPIRY', 'GENERAL') NOT NULL,
    message VARCHAR(255) NOT NULL,
    status ENUM('UNREAD', 'READ') NOT NULL DEFAULT 'UNREAD',
    due_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_reminders_user_unread (user_id, status),
    INDEX idx_reminders_created (created_at DESC)
) ENGINE=InnoDB;
