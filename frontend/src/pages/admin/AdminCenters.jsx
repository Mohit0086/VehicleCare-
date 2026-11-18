import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone } from 'lucide-react';
import { adminApi } from '../../api/admin.api';

export default function AdminCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [actionError, setActionError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCenters() {

      try {
        setLoading(true);
        const res = await adminApi.centers();
        setCenters(res.centers || []);
      } catch {
        setError('Unable to load centers. Check the backend connection.');
      } finally {
        setLoading(false);
      }
    }
    loadCenters();
  }, []);

  async function toggleCenter(center) {
    setUpdating(center.id);
    setActionError('');
    const is_active = !center.is_active;
    try {
      await adminApi.updateCenter(center.id, { is_active });
      setCenters((current) => current.map((item) => item.id === center.id ? { ...item, is_active } : item));
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not update this workshop.');
    } finally {
      setUpdating(null);
    }
  }

  if (error) return <div role="alert" className="p-8 text-red-800">{error} <button onClick={() => window.location.reload()} className="underline">Retry</button></div>;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Service Centers</h1>
        <p className="text-sm text-slate-500 mt-1">
          Registered service workshop facilities, slot capacities, and operational locations.
        </p>
      </div>

      {actionError && <p role="alert" className="text-sm text-red-800">{actionError}</p>}
      {loading && <p role="status" className="text-sm text-slate-600">Loading service centers…</p>}
      {!loading && centers.length === 0 && <p className="text-sm text-slate-600">No workshops have registered yet.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {centers.map((c) => (
          <div key={c.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                  {c.is_active ? 'Approved' : 'Inactive · approval required'}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">{c.name}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 size={20} />
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400 shrink-0" />
                {c.address}, {c.city}
              </p>
              <p className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400 shrink-0" />
                {c.phone}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">Bay Capacity per Slot:</span>
              <strong className="text-slate-900">{c.slot_capacity || 4} vehicles</strong>
            </div>
            <p className="text-sm text-slate-600">{c.mechanic_name} · {c.mechanic_email}</p>
            <button
              type="button"
              className={`button ${c.is_active ? 'button-secondary' : 'button-primary'}`}
              onClick={() => toggleCenter(c)}
              disabled={updating !== null}
            >
              {updating === c.id ? 'Saving…' : c.is_active ? 'Deactivate workshop' : 'Approve workshop'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
