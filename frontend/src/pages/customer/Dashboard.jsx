import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  AlertTriangle,
  Clock,
  Calendar,
  Plus,
  ArrowRight,
  ShieldCheck,
  Wrench,
  Receipt,
  Activity,
  FileCheck2,
} from 'lucide-react';
import { vehicleApi } from '../../api/vehicle.api';
import { bookingApi } from '../../api/booking.api';
import { useAuth } from '../../context/AuthContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {


      try {
        const [vRes, bRes] = await Promise.all([vehicleApi.list(), bookingApi.list()]);
        const vList = vRes.vehicles || vRes.data || (Array.isArray(vRes) ? vRes : []);
        const bList = bRes.bookings || bRes.data || (Array.isArray(bRes) ? bRes : []);
        setVehicles(vList);
        setBookings(bList);

        // Fetch component health across all customer vehicles
        const attentionItems = [];
        for (const v of vList) {
          try {
            const mRes = await vehicleApi.maintenance(v.id);
            const comps = mRes.maintenance || mRes.components || [];
            comps.forEach((c) => {
              if (c.status === 'DUE' || c.status === 'DUE_SOON') {
                attentionItems.push({
                  ...c,
                  vehicleId: v.id,
                  reg_no: v.reg_no,
                  model: `${v.brand} ${v.model}`,
                });
              }
            });
          } catch {}
        }
        setNeedsAttention(attentionItems);
      } catch (err) {
        console.warn('Dashboard load error', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const activeBookings = bookings.filter((b) => ['PENDING', 'ACCEPTED', 'IN_PROGRESS'].includes(b.status));

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-28 bg-slate-100 rounded-3xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="garage-banner bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-blue-200 uppercase bg-blue-900/50 px-3 py-1 rounded-full">
            Customer Garage
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            Track maintenance, receive prompt reminders, and schedule workshop visits.
          </p>
        </div>
        <Link
          to="/customer/book"
          className="px-5 py-3 bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm rounded-xl transition shadow flex items-center gap-2 shrink-0"
        >
          <Wrench size={16} /> Book Service
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Car size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">My Vehicles</p>
            <p className="text-2xl font-bold text-slate-900">{vehicles.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Items Due Now</p>
            <p className="text-2xl font-bold text-red-600">
              {needsAttention.filter((x) => x.status === 'DUE').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Due Soon</p>
            <p className="text-2xl font-bold text-amber-600">
              {needsAttention.filter((x) => x.status === 'DUE_SOON').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Bookings</p>
            <p className="text-2xl font-bold text-emerald-600">{activeBookings.length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Needs Attention & Quick Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs Attention Column (2 cols wide) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Maintenance to check</h2>
              <p className="text-xs text-slate-500">Components evaluated from your odometer and service history.</p>
            </div>
            <Link to="/customer/reminders" className="text-xs font-semibold text-blue-600 hover:underline">
              View all
            </Link>
          </div>

          {needsAttention.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldCheck size={40} className="mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-800">All vehicles are up to date!</p>
              <p className="text-xs text-slate-500 mt-1">No maintenance items or document expiries require immediate care.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {needsAttention.slice(0, 5).map((item, idx) => {
                const isDue = item.status === 'DUE';
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-between gap-3 bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isDue ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        {isDue ? <AlertTriangle size={18} /> : <Clock size={18} />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                        <p className="text-xs text-slate-500">
                          {item.reg_no} · {isDue ? 'Overdue' : 'Due Soon'} (
                          {item.remaining_km != null ? `${item.remaining_km} km left` : 'Review interval'})
                        </p>
                      </div>
                    </div>

                    <Link
                      to={`/customer/book?vehicleId=${item.vehicleId}&component=${encodeURIComponent(item.name)}`}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition shrink-0"
                    >
                      Book Now
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Appointments & Quick Links */}
        <div className="space-y-6">
          {/* Active Bookings Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Active Appointments</h3>
              <Link to="/customer/bookings" className="text-xs font-semibold text-blue-600 hover:underline">
                View
              </Link>
            </div>

            {activeBookings.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No service appointments currently open.</p>
            ) : (
              <div className="space-y-3">
                {activeBookings.slice(0, 3).map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">Booking #{b.id}</span>
                      <span className="font-bold text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                        {b.status}
                      </span>
                    </div>
                    <p className="text-slate-600">{b.reg_no} · {b.booking_date}</p>
                    <p className="text-slate-400 text-[11px]">{b.time_slot}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-100">Quick Tools</h3>
            <div className="space-y-2 text-xs">
              <Link
                to="/customer/vehicles"
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition"
              >
                <span className="flex items-center gap-2"><Car size={15} /> Update Odometer</span>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
              <Link
                to="/customer/predictions"
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition"
              >
                <span className="flex items-center gap-2"><Activity size={15} /> Maintenance estimates</span>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
              <Link
                to="/customer/invoices"
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition"
              >
                <span className="flex items-center gap-2"><Receipt size={15} /> Download Invoices</span>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
              <Link
                to="/customer/documents"
                className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition"
              >
                <span className="flex items-center gap-2"><FileCheck2 size={15} /> Upload Insurance/PUC</span>
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
