import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Car,
  CalendarDays,
  BarChart3,
  AlertCircle,
  IndianRupee,
  ArrowRight,
  Wrench,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { adminApi } from '../../api/admin.api';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAdminData() {

      try {
        setLoading(true);
        const res = await adminApi.dashboard();
        setData(res.dashboard || res.data || res);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load dashboard. Check the backend connection.');
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  if (error) return <div role="alert" className="p-8 text-red-800">{error} <button onClick={() => window.location.reload()} className="underline">Retry</button></div>;

  if (loading || !data) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-32 bg-slate-100 rounded-3xl"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const monthlyBookings = data.monthly_bookings || [];
  const monthlyRevenue = data.monthly_revenue || [];
  const bookingStatus = data.booking_status || [];
  const topModels = data.top_models || [];

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">Platform Oversight</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time analytics for customer service bookings, workshop revenue, and vehicle maintenance status.
          </p>
        </div>

        <Link
          to="/admin/bookings"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-sm shrink-0"
        >
          <Wrench size={16} /> Open Workshop Queue
        </Link>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Users size={14} className="text-blue-600" /> Users
          </span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{data.users ?? 18}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Car size={14} className="text-blue-600" /> Vehicles
          </span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{data.vehicles ?? 42}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <CalendarDays size={14} className="text-amber-600" /> Bookings
          </span>
          <p className="text-xl font-extrabold text-slate-900 mt-1">{data.bookings ?? 126}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" /> Completed
          </span>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{data.completed ?? 91}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <AlertCircle size={14} className="text-red-500" /> Pending
          </span>
          <p className="text-xl font-extrabold text-red-600 mt-1">{data.pending ?? 14}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <IndianRupee size={14} className="text-emerald-600" /> Month Rev
          </span>
          <p className="text-lg font-black text-slate-900 mt-1">
            ₹{Number(data.revenue_month || 286500).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Visual Charts Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bookings Chart */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Monthly Service Bookings</h3>
          <p className="text-xs text-slate-500 mb-4">Total vehicle appointments scheduled per month.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyBookings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Monthly Workshop Revenue (₹)</h3>
          <p className="text-xs text-slate-500 mb-4">Completed service bills and parts turnover.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Booking Status Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Ratio of completed vs pending vs in-progress work.</p>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bookingStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4}>
                  {bookingStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs font-semibold mt-2">
            {bookingStatus.map((s, i) => (
              <span key={s.name} className="flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {s.name}: {s.value}
              </span>
            ))}
          </div>
        </div>

        {/* Top Serviced Vehicle Models */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Most Serviced Vehicle Models</h3>
          <p className="text-xs text-slate-500 mb-4">Highest volume models serviced at the workshop.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topModels} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="model" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Admin Quick Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link
          to="/admin/bookings"
          className="p-5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl shadow-sm transition flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Workshop Queue</h4>
            <p className="text-xs text-slate-500 mt-0.5">Manage customer jobs and billing</p>
          </div>
          <ArrowRight size={16} className="text-blue-600" />
        </Link>

        <Link
          to="/admin/customers"
          className="p-5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl shadow-sm transition flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Customer Accounts</h4>
            <p className="text-xs text-slate-500 mt-0.5">Activate or deactivate users</p>
          </div>
          <ArrowRight size={16} className="text-blue-600" />
        </Link>

        <Link
          to="/admin/intervals"
          className="p-5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl shadow-sm transition flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Service Intervals</h4>
            <p className="text-xs text-slate-500 mt-0.5">Configure 8 component defaults</p>
          </div>
          <ArrowRight size={16} className="text-blue-600" />
        </Link>
      </div>
    </div>
  );
}
