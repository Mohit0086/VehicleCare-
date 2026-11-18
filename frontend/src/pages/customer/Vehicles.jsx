import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Car,
  Plus,
  Search,
  Filter,
  Gauge,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import { vehicleApi } from '../../api/vehicle.api';

export default function CustomerVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fuelFilter, setFuelFilter] = useState('ALL');

  // Add vehicle modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    reg_no: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_type: 'PETROL',
    current_km: '0',
    insurance_expiry: '',
    puc_expiry: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadVehicles = async () => {

    try {
      setLoading(true);
      const res = await vehicleApi.list();
      setVehicles(res.vehicles || res.data || (Array.isArray(res) ? res : []));
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.reg_no || !form.brand || !form.model) {
      setFormError('Please enter registration number, brand, and model.');
      return;
    }

    setSaving(true);
    try {

        await vehicleApi.create({
          ...form,
          year: Number(form.year),
          current_km: Number(form.current_km),
        });
        await loadVehicles();

      setModalOpen(false);
      setForm({
        reg_no: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        fuel_type: 'PETROL',
        current_km: '0',
        insurance_expiry: '',
        puc_expiry: '',
      });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add vehicle. Ensure registration number is unique.');
    } finally {
      setSaving(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const textMatch = `${v.reg_no} ${v.brand} ${v.model}`.toLowerCase().includes(search.toLowerCase());
    const fuelMatch = fuelFilter === 'ALL' || v.fuel_type === fuelFilter;
    return textMatch && fuelMatch;
  });

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Garage Management</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Vehicles</h1>
          <p className="text-sm text-slate-500 mt-1">
            Registered vehicles, real-time maintenance health, and odometer tracking.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition shadow-sm shrink-0"
        >
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      {/* Search and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by registration number, brand, or model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 border border-slate-200 rounded-xl text-sm">
          <Filter size={15} className="text-slate-400" />
          <select
            value={fuelFilter}
            onChange={(e) => setFuelFilter(e.target.value)}
            className="bg-transparent focus:outline-none text-slate-700 font-medium"
          >
            <option value="ALL">All Fuels</option>
            <option value="PETROL">Petrol</option>
            <option value="DIESEL">Diesel</option>
            <option value="CNG">CNG</option>
            <option value="ELECTRIC">Electric</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-3xl"></div>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Car size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-900 text-base">No vehicles found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {search ? 'Try modifying your search query or fuel filter.' : 'Add your first vehicle to start tracking maintenance and services.'}
          </p>
          {!search && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition"
            >
              Add Vehicle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVehicles.map((v) => {
            const isDue = v.overall_status === 'DUE';
            const isDueSoon = v.overall_status === 'DUE_SOON';
            return (
              <Link
                key={v.id}
                to={`/customer/vehicles/${v.id}`}
                className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all rounded-3xl p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      {v.fuel_type}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        isDue
                          ? 'bg-red-100 text-red-700'
                          : isDueSoon
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {isDue ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                      {isDue ? 'Service Due' : isDueSoon ? 'Due Soon' : 'Up to Date'}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 mt-3 group-hover:text-blue-600 transition">
                    {v.reg_no}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">
                    {v.brand} {v.model} · Model {v.year}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Gauge size={15} className="text-slate-400" />
                    {Number(v.current_km || 0).toLocaleString('en-IN')} km
                  </span>
                  <span className="font-semibold text-blue-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                    Details <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Add Vehicle to Garage</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Registration Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MP04-AB-1234"
                  value={form.reg_no}
                  onChange={(e) => setForm({ ...form, reg_no: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold uppercase tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyundai"
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creta"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Model Year *</label>
                  <input
                    type="number"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fuel Type *</label>
                  <select
                    value={form.fuel_type}
                    onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">Electric</option>
                    <option value="HYBRID">Hybrid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Current Odometer Reading (km) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="e.g. 18500"
                  value={form.current_km}
                  onChange={(e) => setForm({ ...form, current_km: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    value={form.insurance_expiry}
                    onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PUC Expiry</label>
                  <input
                    type="date"
                    value={form.puc_expiry}
                    onChange={(e) => setForm({ ...form, puc_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50"
                >
                  {saving ? 'Adding Vehicle…' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
