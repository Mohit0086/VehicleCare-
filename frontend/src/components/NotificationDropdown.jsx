import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, RefreshCw, AlertTriangle, Clock, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

export default function NotificationDropdown({ customerTools = true }) {
  const [open, setOpen] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const dropdownRef = useRef(null);

  const fetchReminders = async () => {

    try {
      setLoading(true);
      const res = await api.get('/reminders');
      setReminders(res.data?.reminders || []);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 45000); // Live poll every 45s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = reminders.filter((r) => r.status === 'UNREAD').length;

  // Prompt diagnostic scan feature (Guide's recommendation)
  const runPromptDiagnosticScan = async () => {
    setScanning(true);
    try {

        await api.post('/reminders/prompt-scan');

      await fetchReminders();
    } catch (e) {
      console.warn('Scan trigger error', e);
    } finally {
      setScanning(false);
    }
  };

  const markAllRead = async () => {
    try {

        await api.patch('/reminders/mark-all-read');

      setReminders((prev) => prev.map((r) => ({ ...r, status: 'READ' })));
    } catch (e) {
      console.warn('Mark all read error', e);
    }
  };

  const markSingleRead = async (id) => {
    try {

        await api.patch(`/reminders/${id}/read`);

      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'READ' } : r)));
    } catch (e) {
      console.warn('Mark read error', e);
    }
  };

  const getIcon = (type) => {
    if (type?.includes('MAINTENANCE_DUE')) return <AlertTriangle className="text-red-500 shrink-0" size={17} />;
    if (type?.includes('EXPIRY')) return <Clock className="text-amber-500 shrink-0" size={17} />;
    if (type?.includes('INVOICE')) return <FileText className="text-emerald-500 shrink-0" size={17} />;
    return <Calendar className="text-blue-500 shrink-0" size={17} />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
        onClick={() => setOpen(!open)}
        aria-label="View notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {customerTools && <button
                type="button"
                onClick={runPromptDiagnosticScan}
                disabled={scanning}
                title="Check your records for maintenance and document reminders"
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
                {scanning ? 'Scanning…' : 'Check for reminders'}
              </button>}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <CheckCheck size={13} />
                  Mark all
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {loading && reminders.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">Checking for updates…</div>
            ) : reminders.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-800">You're all caught up!</p>
                <p className="text-xs text-slate-500 mt-1">Booking updates and reminders appear here.</p>
              </div>
            ) : (
              reminders.slice(0, 8).map((r) => {
                const isUnread = r.status === 'UNREAD';
                return (
                  <div
                    key={r.id}
                    className={`p-3.5 flex items-start gap-3 transition ${
                      isUnread ? 'bg-blue-50/50 hover:bg-blue-50' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="mt-0.5">{getIcon(r.reminder_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${isUnread ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                        {r.message}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : 'Just now'}
                        </span>
                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => markSingleRead(r.id)}
                            className="text-[11px] text-blue-600 hover:underline font-medium"
                          >
                            Mark read
                          </button>
                        )}
                        {r.vehicle_id && (
                          <Link
                            to={`/customer/vehicles/${r.vehicle_id}`}
                            onClick={() => setOpen(false)}
                            className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                          >
                            View vehicle →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {customerTools && <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <Link
              to="/customer/reminders"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-700 hover:text-blue-700 font-semibold"
            >
              View reminders →
            </Link>
          </div>}
        </div>
      )}
    </div>
  );
}
