import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar, { homeFor } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Authentication Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RegisterGarage from './pages/auth/RegisterGarage';
import GarageBookings from './pages/garage/GarageBookings';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Customer Portal Pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerVehicles from './pages/customer/Vehicles';
import CustomerVehicleDetail from './pages/customer/VehicleDetail';
import BookService from './pages/customer/BookService';
import CustomerBookings from './pages/customer/MyBookings';
import CustomerInvoices from './pages/customer/Invoices';
import CustomerPredictions from './pages/customer/Predictions';
import CustomerDocuments from './pages/customer/Documents';
import CustomerReminders from './pages/customer/Reminders';

// System Administrator Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminIntervals from './pages/admin/AdminIntervals';
import AdminCenters from './pages/admin/AdminCenters';

function AppRoutes() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading VehicleCare...</p>
        </div>
      </div>
    );
  }

  return (
    <Navbar>
      {isAuthenticated && user ? (
        <Routes>
          {/* Default Route: Redirects to appropriate role dashboard */}
          <Route path="/" element={<Navigate to={homeFor(user.role)} replace />} />

          {/* Customer Portal Routes (Allowed for CUSTOMER and legacy OWNER) */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/vehicles"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER']}>
                <CustomerVehicles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/vehicles/:id"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER']}>
                <CustomerVehicleDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/book"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER']}>
                <BookService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bookings"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER']}>
                <CustomerBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/invoices"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER']}>
                <CustomerInvoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/predictions"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER']}>
                <CustomerPredictions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/documents"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER']}>
                <CustomerDocuments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/reminders"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'OWNER']}>
                <CustomerReminders />
              </ProtectedRoute>
            }
          />

          <Route path="/garage/bookings" element={<ProtectedRoute allowedRoles={['GARAGE']}><GarageBookings /></ProtectedRoute>} />

          {/* Admin Routes (Allowed for ADMIN and legacy MECHANIC) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MECHANIC']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MECHANIC']}>
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/customers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MECHANIC']}>
                <AdminCustomers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={<Navigate to="/admin/customers" replace />}
          />
          <Route
            path="/admin/intervals"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MECHANIC']}>
                <AdminIntervals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/centers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'MECHANIC']}>
                <AdminCenters />
              </ProtectedRoute>
            }
          />

          {/* Backward compatibility redirects */}
          <Route path="/owner/dashboard" element={<Navigate to="/customer/dashboard" replace />} />
          <Route path="/owner/vehicles" element={<Navigate to="/customer/vehicles" replace />} />
          <Route path="/owner/vehicles/:id" element={<Navigate to="/customer/vehicles" replace />} />
          <Route path="/owner/bookings" element={<Navigate to="/customer/bookings" replace />} />
          <Route path="/owner/bookings/new" element={<Navigate to="/customer/book" replace />} />
          <Route path="/owner/invoices" element={<Navigate to="/customer/invoices" replace />} />
          <Route path="/owner/predictions" element={<Navigate to="/customer/predictions" replace />} />
          <Route path="/owner/documents" element={<Navigate to="/customer/documents" replace />} />
          <Route path="/owner/reminders" element={<Navigate to="/customer/reminders" replace />} />
          <Route path="/mechanic/jobs" element={<Navigate to="/admin/bookings" replace />} />
          <Route path="/mechanic/jobs/active" element={<Navigate to="/admin/bookings" replace />} />
          <Route path="/mechanic/completed" element={<Navigate to="/admin/bookings" replace />} />

          {/* Access Denied and 404 */}
          <Route
            path="/403"
            element={
              <div className="p-8 max-w-lg mx-auto text-center mt-12 bg-white rounded-3xl border border-slate-200">
                <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  This section is only available for authorized roles.
                </p>
                <Link to={homeFor(user.role)} className="button button-primary text-xs">
                  Back to Dashboard
                </Link>
              </div>
            }
          />
          <Route path="*" element={<Navigate to={homeFor(user.role)} replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-garage" element={<RegisterGarage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </Navbar>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
