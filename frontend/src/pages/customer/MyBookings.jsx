import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Car,
  Filter,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { bookingApi } from '../../api/booking.api';

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionMsg, setActionMsg] = useState('');

  const loadBookings = async () => {

    try {
      setLoading(true);
      const res = await bookingApi.list(statusFilter === 'ALL' ? {} : { status: statusFilter });
      setBookings(res.bookings || res.data || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [statusFilter]);

  // Cancel booking while PENDING (FR-23)
  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this pending appointment?')) return;
    try {

        await bookingApi.updateStatus(bookingId, { status: 'CANCELLED' });
        await loadBookings();

      setActionMsg('Appointment cancelled successfully.');
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to cancel booking.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Pending Approval</span>;
      case 'ACCEPTED':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Accepted</span>;
      case 'IN_PROGRESS':
        return <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">In Progress</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Completed</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded-full">Declined / Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My bookings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track appointment approvals, workshop progress, and completed services.
          </p>
        </div>
        <Link
          to="/customer/book"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-sm shrink-0"
        >
          <PlusCircle size={16} /> Book New Service
        </Link>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 border border-emerald-100">
          <CheckCircle2 size={16} /> {actionMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st === 'ALL' ? 'All Bookings' : st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Bookings Content */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-3xl"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-900 text-base">No bookings found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {statusFilter !== 'ALL'
              ? 'No appointments currently match this status filter.'
              : 'Schedule an inspection or routine service visit for your car.'}
          </p>
          <Link
            to="/customer/book"
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition"
          >
            Book Service Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">#BOOKING-{b.id}</span>
                  {getStatusBadge(b.status)}
                </div>

                <h3 className="text-lg font-bold text-slate-900">
                  {b.reg_no} — {b.brand} {b.model}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Calendar size={13} className="text-slate-400" /> {b.booking_date}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Clock size={13} className="text-slate-400" /> {b.time_slot}
                  </span>
                  <span>Workshop: <strong>{b.center_name || 'VehicleCare Central Workshop'}</strong></span>
                </div>

                {b.owner_notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl mt-2">
                    {b.owner_notes}
                  </p>
                )}
              </div>

              {/* Action column */}
              <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                {b.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancel(b.id)}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition border border-red-200"
                  >
                    Cancel Booking
                  </button>
                )}

                {b.status === 'COMPLETED' && (
                  <Link
                    to="/customer/invoices"
                    className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                  >
                    View Invoice →
                  </Link>
                )}

                <span className="text-[11px] text-slate-400 font-medium">
                  Created {new Date(b.created_at || Date.now()).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
