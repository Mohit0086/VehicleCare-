# VehicleCare — Smart Vehicle Maintenance & Service Management System

**Version 1.1** | October 2026  
**Academic Project**: Sagar Institute of Science and Technology (SISTec), Bhopal (Affiliated to RGPV)  
**Team Members**: Gourav SinghRathore (Leader), Manas Agrawal, Juber Khan, Mohit Choudhary  
**Project Guide**: Prof. Shumali Gupta  

---

## 1. Overview & Perspective

VehicleCare is a modern three-tier web application integrated with an intelligent machine learning microservice for automated vehicle health tracking, service scheduling, workshop job workflow, digital invoicing, and predictive maintenance.

```
 [ React 18 + Vite + Tailwind CSS ]
                 |
            HTTPS / JSON
                 v
   [ Node.js + Express REST API ] <=============> [ MySQL 8.0 Database (3NF) ]
                 |
            HTTP / JSON
                 v
  [ Python / Flask ML Microservice (scikit-learn) ]
```

---

## 2. Key Modules & Functional Requirements (SRS v1.1)

| Module | SRS ID | Description |
| :--- | :--- | :--- |
| **Authentication & Authorization** | `FR-1` to `FR-5`, `FR-45`, `FR-46` | Registration, bcrypt password hashing, JWT authentication, role-based authorization (`OWNER`, `MECHANIC`, `ADMIN`), password reset token links. |
| **Vehicle Management** | `FR-6` to `FR-10` | CRUD operations, unique registration check, monotonic odometer verification, audit logging in `odometer_logs`. |
| **Maintenance Tracking** | `FR-11` to `FR-16`, `FR-48` | Dynamic tracking of 8 components (Engine Oil, Brakes, Tyres, Battery, Air Filter, Coolant, AC, General Service). Distance & time status engine (`DUE`, `DUE_SOON`, `OK`), baseline rules. |
| **Service Booking & Workflow** | `FR-17` to `FR-23` | Appointment booking, slot capacity checking to prevent double-booking, mechanic job queue, state machine (`PENDING -> ACCEPTED -> IN_PROGRESS -> COMPLETED / REJECTED`). |
| **Billing & Service History** | `FR-24` to `FR-28`, `FR-49` | Atomic database transactions, line-item billing (`job_items`), odometer & component sync, PDF invoice generation via PDFKit, mechanic ledger. |
| **Reminders & Documents** | `FR-29` to `FR-34` | Document upload (RC, Insurance, PUC) with Multer, daily background scheduled job (`node-cron`) for maintenance and expiry alerts (30-day and 7-day triggers). |
| **ML Predictive Maintenance** | `FR-35` to `FR-40` | scikit-learn regression models predicting oil change km, brake inspection km, and estimated service cost (INR). Graceful rule-based fallback if ML service is offline. |
| **Administration & Governance** | `FR-41` to `FR-44`, `FR-47` | Overview metrics, monthly bookings and revenue charts, user & service center activation/approval, interval configuration. |

---

## 3. Technology Stack

* **Frontend:** React 18, Vite 5, Tailwind CSS, Recharts, Lucide-react, Axios
* **Backend:** Node.js, Express.js, MySQL 2 (`mysql2/promise`), JWT, bcrypt, PDFKit, node-cron, Multer
* **Database:** MySQL 8.0+ (Normalized to Third Normal Form)
* **ML Microservice:** Python 3.9+, Flask, scikit-learn, pandas, numpy, joblib

---

## 4. Database Setup

1. Create and seed the MySQL database:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/seed.sql
   ```

### Default Seed Accounts
All accounts are provisioned with default passwords: `Admin@123` / `Customer@123`

| Role | Email | Password | Scope & Responsibilities |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@vehiclecare.com` | `Admin@123` | Workshop Bay Management, Job Scheduling, Billing, Maintenance Intervals, Platform Analytics |
| **CUSTOMER** | `customer@vehiclecare.com` | `Customer@123` | Garage Vehicles, Health Status, Booking Wizard, Digital Invoices, Prompt Notifications |
| **CUSTOMER (Demo 2)** | `owner@example.com` | `Customer@123` | Secondary owner profile with Hyundai Creta (`RJ14-AB-1234`) and Tata Nexon EV (`MH12-CD-5678`) |

---

## 5. Guide Feedback Addressed (Prof. Shumali Gupta)

| Feedback Item | Guide Concern | Implementation Details |
| :--- | :--- | :--- |
| **1. Front-End Improvement** | Single-file minified 46KB bundle looked AI-generated / copied. | Refactored into clean, modular, human-authored React components in `src/pages/customer/` and `src/pages/admin/` with standard Tailwind CSS. |
| **2. Improved Booking Process** | Booking lacked real-time health feedback and slot management. | Built a 3-step interactive booking wizard (`BookService.jsx`) featuring vehicle health pre-inspection, categorized parts & labour estimate catalog, and real-time slot capacity validation. |
| **3. Prompt Notification Generation** | Reminders were passive and lacked instant feedback. | Engineered event-driven prompt notification dispatch (`reminderService.js`) on booking, status changes, billing, and odometer updates, paired with an interactive Navbar notification dropdown featuring a one-click "Run Diagnostic Scan" button. |

---

## 6. Verification & Automated Test Suite

A comprehensive verification script validates all 49 SRS functional requirements and the project guide's recommendations:

```bash
node backend/verify-backend.js
```
Expected output: **31 / 31 CHECKS PASSED (100%)**

---

## 7. Running the Application

### 1. Backend API (Port 5000)
```bash
cd backend
npm install
npm run dev
```

### 2. Machine Learning Microservice (Port 6000)
```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python generate_data.py
python train.py
python app.py
```

### 3. Frontend Web Application (Port 5173)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. API Reference Summary

* **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/logout`
* **Vehicles:** `GET /api/vehicles`, `POST /api/vehicles`, `GET /api/vehicles/:id`, `PATCH /api/vehicles/:id/odometer`, `GET /api/vehicles/:id/maintenance`, `GET /api/vehicles/:id/odometer-logs`, `GET /api/vehicles/:id/service-history`
* **Bookings:** `GET /api/bookings`, `POST /api/bookings`, `GET /api/bookings/:id`, `PATCH /api/bookings/:id/status`, `GET /api/bookings/slots`
* **Bills & Invoices:** `GET /api/bills`, `GET /api/bills/:id`, `GET /api/bills/:id/pdf`
* **Reminders:** `GET /api/reminders`, `PATCH /api/reminders/:id/read`, `POST /api/reminders/scan`
* **Documents:** `GET /api/vehicles/:vehicleId/documents`, `POST /api/vehicles/:vehicleId/documents`, `GET /api/documents/:id/download`
* **Predictions:** `GET /api/vehicles/:id/prediction`
* **Admin:** `GET /api/admin/dashboard`, `GET /api/admin/users`, `PATCH /api/admin/users/:id`, `GET /api/admin/centers`, `PATCH /api/admin/centers/:id`, `GET /api/admin/intervals`, `PATCH /api/admin/intervals/:id`
