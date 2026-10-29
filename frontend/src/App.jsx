import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar, { homeFor } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OwnerDashboard from './pages/owner/Dashboard';

import AdminDashboard from './pages/admin/Dashboard';
import WorkspacePage from './pages/WorkspacePage';

function RouteFrame() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return <div className="auth-loading"><div className="skeleton skeleton-title"/><div className="skeleton skeleton-line"/></div>;
  return <><Navbar />{isAuthenticated && user && <Routes>
    <Route path="/forgot-password" element={<ForgotPassword />} /><Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/" element={<Navigate to={homeFor(user.role)} replace />} />
    <Route path="/owner/dashboard" element={<ProtectedRoute allowedRoles={['OWNER']}><OwnerDashboard /></ProtectedRoute>} />
    <Route path="/owner/vehicles" element={<ProtectedRoute allowedRoles={['OWNER']}><WorkspacePage section="vehicles" /></ProtectedRoute>} />
    <Route path="/owner/predictions" element={<ProtectedRoute allowedRoles={['OWNER']}><WorkspacePage section="predictions" /></ProtectedRoute>} />
    <Route path="/owner/vehicles/new" element={<ProtectedRoute allowedRoles={['OWNER']}><WorkspacePage section="vehicle-new" /></ProtectedRoute>} />
    <Route path="/owner/vehicles/:id" element={<ProtectedRoute allowedRoles={['OWNER']}><WorkspacePage section="vehicle-detail" /></ProtectedRoute>} />
    <Route path="/owner/bookings" element={<ProtectedRoute allowedRoles={['OWNER']}><WorkspacePage section="bookings" /></ProtectedRoute>} />
    <Route path="/owner/bookings/new" element={<ProtectedRoute allowedRoles={['OWNER']}><WorkspacePage section="booking-new" /></ProtectedRoute>} />
    <Route path="/owner/invoices" element={<ProtectedRoute allowedRoles={['OWNER']}><WorkspacePage section="invoices" /></ProtectedRoute>} />
    <Route path="/owner/invoices/:id" element={<ProtectedRoute allowedRoles={['OWNER']}><WorkspacePage section="invoice-detail" /></ProtectedRoute>} />
    <Route path="/owner/reminders" element={<ProtectedRoute allowedRoles={['OWNER']}><WorkspacePage section="reminders" /></ProtectedRoute>} />
    <Route path="/owner/documents" element={<ProtectedRoute allowedRoles={['OWNER']}><WorkspacePage section="documents" /></ProtectedRoute>} />
    <Route path="/mechanic/jobs" element={<ProtectedRoute allowedRoles={['MECHANIC']}><WorkspacePage section="queue" /></ProtectedRoute>} />
    <Route path="/mechanic/jobs/active" element={<ProtectedRoute allowedRoles={['MECHANIC']}><WorkspacePage section="active-jobs" /></ProtectedRoute>} />
    <Route path="/mechanic/jobs/:id" element={<ProtectedRoute allowedRoles={['MECHANIC']}><WorkspacePage section="job-detail" /></ProtectedRoute>} />
    <Route path="/mechanic/completed" element={<ProtectedRoute allowedRoles={['MECHANIC']}><WorkspacePage section="completed-jobs" /></ProtectedRoute>} />
    <Route path="/mechanic/profile" element={<ProtectedRoute allowedRoles={['MECHANIC']}><WorkspacePage section="profile" /></ProtectedRoute>} />
    <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><WorkspacePage section="users" /></ProtectedRoute>} />
    <Route path="/admin/centers" element={<ProtectedRoute allowedRoles={['ADMIN']}><WorkspacePage section="centers" /></ProtectedRoute>} />
    <Route path="/admin/intervals" element={<ProtectedRoute allowedRoles={['ADMIN']}><WorkspacePage section="intervals" /></ProtectedRoute>} />
    <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['ADMIN']}><WorkspacePage section="all-bookings" /></ProtectedRoute>} />
    <Route path="/403" element={<div className="page-wrap"><div className="panel empty-state"><h1>Access denied</h1><p>This page is not available for your account role.</p><Link className="button button-primary" to={homeFor(user.role)}>Back to your workspace</Link></div></div>} />
    <Route path="*" element={<div className="page-wrap"><div className="panel empty-state"><h1>Page not found</h1><p>We couldn’t find that page.</p><Link className="button button-primary" to={homeFor(user.role)}>Back to your workspace</Link></div></div>} />
  </Routes>}{!isAuthenticated && !user && <Routes>
    <Route path="/" element={<Home />} /><Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/forgot-password" element={<ForgotPassword />} /><Route path="/reset-password" element={<ResetPassword />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>}</>;
}
export default function App() { return <AuthProvider><BrowserRouter><RouteFrame /></BrowserRouter></AuthProvider>; }






