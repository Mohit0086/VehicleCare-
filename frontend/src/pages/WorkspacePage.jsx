import React from 'react';
import CustomerVehicles from './customer/Vehicles';
import CustomerVehicleDetail from './customer/VehicleDetail';
import BookService from './customer/BookService';
import CustomerBookings from './customer/MyBookings';
import CustomerInvoices from './customer/Invoices';
import CustomerPredictions from './customer/Predictions';
import CustomerDocuments from './customer/Documents';
import CustomerReminders from './customer/Reminders';

import AdminDashboard from './admin/AdminDashboard';
import AdminBookings from './admin/AdminBookings';
import AdminCustomers from './admin/AdminCustomers';
import AdminIntervals from './admin/AdminIntervals';
import AdminCenters from './admin/AdminCenters';

/**
 * Legacy Router Adapter
 * Maps section query/prop to the modern clean customer and admin components.
 */
export default function WorkspacePage({ section }) {
  switch (section) {
    case 'vehicles':
    case 'vehicle-new':
      return <CustomerVehicles />;
    case 'vehicle-detail':
      return <CustomerVehicleDetail />;
    case 'booking-new':
      return <BookService />;
    case 'bookings':
      return <CustomerBookings />;
    case 'invoices':
    case 'invoice-detail':
      return <CustomerInvoices />;
    case 'predictions':
      return <CustomerPredictions />;
    case 'documents':
      return <CustomerDocuments />;
    case 'reminders':
      return <CustomerReminders />;
    case 'queue':
    case 'active-jobs':
    case 'completed-jobs':
    case 'job-detail':
    case 'all-bookings':
      return <AdminBookings />;
    case 'users':
      return <AdminCustomers />;
    case 'intervals':
      return <AdminIntervals />;
    case 'centers':
      return <AdminCenters />;
    default:
      return <CustomerVehicles />;
  }
}
