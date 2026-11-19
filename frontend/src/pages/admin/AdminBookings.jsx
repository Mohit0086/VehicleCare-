import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle2,
  XCircle,
  Play,
  Calendar,
  Clock,
  Car,
  User,
  Plus,
  Trash2,
  Receipt,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import { bookingApi } from '../../api/booking.api';
import { billApi } from '../../api/bill.api';

export default function AdminBookings({ garageName }) {
  const [tab, setTab] = useState('PENDING');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [loadError, setLoadError] = useState('');

  // Complete & Bill Modal State
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [serviceKm, setServiceKm] = useState('');
  const [mechanicNotes, setMechanicNotes] = useState('');
  const [labourCharge, setLabourCharge] = useState('');
  const [lineItems, setLineItems] = useState([]);
  const [savingBill, setSavingBill] = useState(false);

  const loadBookings = async () => {

    try {
      setLoading(true);
      setLoadError('');
      const res = await bookingApi.list({ status: tab === 'ALL' ? undefined : tab });
      setBookings(res.bookings || res.data || []);
    } catch (err) {
      setBookings([]);
      setLoadError(err.response?.data?.error || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [tab]);

  // Handle Status Transitions
  const handleTransition = async (bookingId, newStatus) => {
    let reason = '';
    if (newStatus === 'REJECTED') {
      reason = window.prompt('Please provide a reason for declining this booking:') || '';
      if (!reason.trim()) return;
    }

    try {

        await bookingApi.updateStatus(bookingId, { status: newStatus, mechanic_notes: reason });
        setMsg(`Booking updated.`);
        await loadBookings();

    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to update booking status.');
    }
  };

  // Open Complete Job & Billing Modal
  const openCompleteModal = (booking) => {
    setSelectedBooking(booking);
    setServiceKm(String(booking.vehicle?.current_km ?? booking.current_km ?? ''));
    setMechanicNotes(booking.mechanic_notes || '');
    setLabourCharge('');
    setLineItems([]);
    setCompleteModalOpen(true);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: '' }]);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const partsTotal = lineItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
    0
  );
  const grandTotal = partsTotal + (Number(labourCharge) || 0);

  // Submit Job Completion & Bill Generation
  const handleCompleteAndBill = async (e) => {
    e.preventDefault();
    if (!serviceKm) {
      window.alert('Please enter actual vehicle odometer reading at service.');
      return;
    }

    setSavingBill(true);
    try {

        await bookingApi.updateStatus(selectedBooking.id, {
          status: 'COMPLETED',
          odometer_at_service: Number(serviceKm),
          mechanic_notes: mechanicNotes,
          labour_charge: Number(labourCharge),
          job_items: lineItems.filter((i) => i.description.trim()).map((i) => ({
            ...i,
            quantity: Number(i.quantity),
            unit_price: Number(i.unit_price),
            item_type: 'PART',
          })),
        });
        setMsg(`Job #${selectedBooking.id} completed. Invoice created.`);
        await loadBookings();

      setCompleteModalOpen(false);
    } catch (err) {
      window.alert(err.response?.data?.error || 'Failed to complete job.');
    } finally {
      setSavingBill(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{garageName ? `${garageName} bookings` : 'Workshop bookings'}</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review booking requests and create invoices for completed services.
        </p>
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 border border-emerald-100 font-semibold">
          <CheckCircle2 size={16} /> {msg}
        </div>
      )}

      {loadError && (
        <p role="alert" className="text-sm text-red-800">
          {loadError} <button type="button" className="underline" onClick={loadBookings}>Retry</button>
        </p>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        {[
          { key: 'PENDING', label: 'New Requests' },
          { key: 'ACCEPTED', label: 'Accepted / Scheduled' },
          { key: 'IN_PROGRESS', label: 'In Progress (Floor)' },
          { key: 'COMPLETED', label: 'Completed Jobs & Bills' },
          { key: 'ALL', label: 'All Records' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition whitespace-nowrap ${
              tab === t.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Booking Cards / List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl"></div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Wrench size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-900 text-base">No bookings in this tab</h3>
          <p className="text-xs text-slate-500 mt-1">Customer appointments will appear here in real time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-slate-300 transition flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-400">#JOB-{b.id}</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      b.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : b.status === 'ACCEPTED'
                        ? 'bg-blue-100 text-blue-800'
                        : b.status === 'IN_PROGRESS'
                        ? 'bg-indigo-100 text-indigo-800'
                        : b.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-slate-900">
                  {b.reg_no || b.vehicle?.reg_no} — {b.brand || b.vehicle?.brand} {b.model || b.vehicle?.model}
                </h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <User size={13} className="text-slate-400" /> Customer: <strong>{b.owner_name || b.customer_name || 'Customer'}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-slate-400" /> {b.booking_date} ({b.time_slot})
                  </span>
                  <span>Vehicle Odo: <strong>{Number(b.vehicle_current_km || b.current_km || 0).toLocaleString('en-IN')} km</strong></span>
                </div>

                {b.owner_notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mt-2 border border-slate-100">
                    <strong>Customer Request:</strong> {b.owner_notes}
                  </p>
                )}
              </div>

              {/* Action Buttons depending on status */}
              <div className="flex flex-wrap lg:flex-col gap-2 shrink-0 justify-end">
                {b.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleTransition(b.id, 'ACCEPTED')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                    >
                      Accept Appointment
                    </button>
                    <button
                      onClick={() => handleTransition(b.id, 'REJECTED')}
                      className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs rounded-xl transition"
                    >
                      Decline
                    </button>
                  </>
                )}

                {b.status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleTransition(b.id, 'IN_PROGRESS')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm"
                  >
                    <Play size={13} /> Start Workshop Work
                  </button>
                )}

                {b.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => openCompleteModal(b)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md"
                  >
                    <Receipt size={14} /> Complete Job & Generate Bill
                  </button>
                )}

                {b.status === 'COMPLETED' && (
                  <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl text-center">
                    ✓ Invoiced & Synchronized
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Job & Billing Modal */}
      {completeModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase">Final Service Settlement</span>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Complete Job #{selectedBooking.id} & Generate Bill
                </h2>
                <p className="text-xs text-slate-500">
                  Vehicle: {selectedBooking.reg_no} ({selectedBooking.brand} {selectedBooking.model})
                </p>
              </div>
              <button
                onClick={() => setCompleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteAndBill} className="mt-5 space-y-4">
              {/* Service Odometer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Actual Odometer Reading at Service (km) *
                </label>
                <input
                  type="number"
                  required
                  min={selectedBooking.vehicle?.current_km || selectedBooking.current_km || 0}
                  value={serviceKm}
                  onChange={(e) => setServiceKm(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This updates the vehicle’s odometer when you complete the job.
                </p>
              </div>

              {/* Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Parts & Consumables Used</label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Part
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Part description"
                        value={item.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs"
                      />
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                        className="w-16 px-2.5 py-2 border border-slate-300 rounded-xl text-xs text-center"
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Rate ₹"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)}
                        className="w-24 px-2.5 py-2 border border-slate-300 rounded-xl text-xs text-right font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labour Charge */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Workshop Labour Charges (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={labourCharge}
                  onChange={(e) => setLabourCharge(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Mechanic Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Work Done Notes</label>
                <textarea
                  rows="2"
                  value={mechanicNotes}
                  onChange={(e) => setMechanicNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
                ></textarea>
              </div>

              {/* Total Calculation Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500">Calculated Grand Total:</span>
                  <p className="text-xl font-black text-emerald-700">₹{grandTotal.toLocaleString('en-IN')}</p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  Parts: ₹{partsTotal} + Labour: ₹{labourCharge || 0}
                </span>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBill}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition shadow-md disabled:opacity-50"
                >
                  {savingBill ? 'Generating Official Invoice…' : 'Complete Job & Dispatch Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
