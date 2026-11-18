import React, { useState, useEffect } from 'react';
import { Settings2, CheckCircle2, AlertCircle, Wrench, Edit3, Save, X } from 'lucide-react';
import { adminApi } from '../../api/admin.api';

export default function AdminIntervals() {
  const [intervals, setIntervals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editKm, setEditKm] = useState('');
  const [editMonths, setEditMonths] = useState('');
  const [msg, setMsg] = useState('');

  const loadIntervals = async () => {

    try {
      setLoading(true);
      const res = await adminApi.intervals();
      setIntervals(res.intervals || []);
    } catch {
      setError('Unable to load intervals. Check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntervals();
  }, []);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditKm(String(item.interval_km || item.default_interval_km || 10000));
    setEditMonths(String(item.interval_months || item.default_interval_months || 6));
  };

  const handleSave = async (id) => {
    setMsg('');
    try {

        await adminApi.updateInterval(id, {
          interval_km: Number(editKm),
          interval_months: Number(editMonths),
        });
        setMsg('Component maintenance interval updated successfully.');
        await loadIntervals();

      setEditingId(null);
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to update interval.');
    }
  };

  if (error) return <div role="alert" className="p-8 text-red-800">{error} <button onClick={() => window.location.reload()} className="underline">Retry</button></div>;

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Maintenance Engine Configuration</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Service Intervals (FR-16)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure default mileage thresholds and time cycles for the 8 core vehicle components.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-100 font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-start gap-2.5">
        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
        <span>
          <strong>Notice:</strong> Modifying service intervals updates standard component baselines and dynamically
          affects future status calculations across customer vehicles.
        </span>
      </div>

      {/* Intervals Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">Component Name</th>
                <th className="p-4">Default Distance (km)</th>
                <th className="p-4">Time Interval (Months)</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {intervals.map((item, idx) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-900">{item.name}</td>
                    <td className="p-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editKm}
                          onChange={(e) => setEditKm(e.target.value)}
                          className="w-28 px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      ) : (
                        <span className="font-semibold text-slate-700">
                          {Number(item.interval_km || item.default_interval_km).toLocaleString('en-IN')} km
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editMonths}
                          onChange={(e) => setEditMonths(e.target.value)}
                          className="w-20 px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold"
                        />
                      ) : (
                        <span className="font-semibold text-slate-700">
                          {item.interval_months || item.default_interval_months} months
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {isEditing ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleSave(item.id)}
                            className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded-lg hover:bg-blue-700 transition"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-200 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs rounded-lg transition"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
