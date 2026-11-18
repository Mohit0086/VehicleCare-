import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Car,
  Wrench,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { vehicleApi } from '../../api/vehicle.api';
import { bookingApi } from '../../api/booking.api';

const SERVICE_CATALOG = [
  { id: 'Engine Oil', name: 'Engine Oil & Filter Replacement', icon: '🛢️', estPrice: 2800, desc: 'Full synthetic oil replacement & OEM filter' },
  { id: 'Brakes', name: 'Brake Inspection & Pad Service', icon: '🛑', estPrice: 2200, desc: 'Brake calipers, disc wear & pad inspection' },
  { id: 'Tyres', name: 'Tyre Rotation & Wheel Alignment', icon: '🛞', estPrice: 1200, desc: 'Alignment check, balancing & tread measurement' },
  { id: 'Battery', name: 'Battery Health & Terminal Check', icon: '🔋', estPrice: 650, desc: 'Voltage testing, terminal cleaning & load test' },
  { id: 'Air Filter', name: 'Air & Cabin Filter Replacement', icon: '💨', estPrice: 850, desc: 'Intake and cabin air filter cleaning/renewal' },
  { id: 'Coolant', name: 'Engine Radiator Coolant Flush', icon: '❄️', estPrice: 1400, desc: 'Radiator flush & anti-freeze replacement' },
  { id: 'Air Conditioner', name: 'AC Refrigerant Gas & Cooling Check', icon: '🧊', estPrice: 1800, desc: 'Refrigerant pressure check & condenser cleaning' },
  { id: 'General Service', name: '40-Point Periodic General Service', icon: '🛠️', estPrice: 3500, desc: 'Comprehensive bumper-to-bumper vehicle inspection' },
];

export default function BookService() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Wizard Steps (1: Vehicle, 2: Services, 3: Date & Slot, 4: Review)
  const [step, setStep] = useState(1);

  // Form State
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(searchParams.get('vehicleId') || '');
  const [selectedServices, setSelectedServices] = useState(
    searchParams.get('component') ? [searchParams.get('component')] : ['General Service']
  );
  const [bookingDate, setBookingDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [timeSlot, setTimeSlot] = useState('');
  const [centers, setCenters] = useState([]);
  const [centerId, setCenterId] = useState('');
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [workshopError, setWorkshopError] = useState('');
  const [ownerNotes, setOwnerNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Fetch Customer Vehicles
  useEffect(() => {
    async function loadVehicles() {

      try {
        const res = await vehicleApi.list();
        const list = res.vehicles || res.data || (Array.isArray(res) ? res : []);
        setVehicles(list);
        if (!selectedVehicleId && list.length > 0) {
          setSelectedVehicleId(list[0].id);
        }
      } catch (err) {
        setError('Failed to load your vehicles. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadVehicles();
  }, []);

  useEffect(() => {
    let active = true;
    bookingApi.centers().then(({ centers }) => {
      if (!active) return;
      setCenters(centers);
      setCenterId(String(centers[0]?.id || ''));
    }).catch(() => {
      if (active) setWorkshopError('Could not load approved workshops. Refresh the page to try again.');
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!centerId || !bookingDate) return;
    let active = true;
    setSlotsLoading(true);
    setWorkshopError('');
    bookingApi.slots({ service_center_id: centerId, booking_date: bookingDate })
      .then(({ slots }) => {
        if (active) setSlots(slots);
      })
      .catch(() => {
        if (active) setWorkshopError('Could not load time slots. Choose the workshop or date again.');
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => { active = false; };
  }, [centerId, bookingDate]);

  const selectedCenter = centers.find((center) => String(center.id) === centerId);

  const toggleService = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      if (selectedServices.length === 1) return; // Keep at least one
      setSelectedServices(selectedServices.filter((s) => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const selectedVehicle = vehicles.find((v) => String(v.id) === String(selectedVehicleId)) || vehicles[0];

  const estimatedTotal = selectedServices.reduce((sum, sId) => {
    const item = SERVICE_CATALOG.find((sc) => sc.id === sId);
    return sum + (item ? item.estPrice : 1500);
  }, 0);

  const handleSubmit = async () => {
    if (!selectedVehicleId || !centerId || !bookingDate || !timeSlot) {
      setError('Please select a vehicle, workshop, appointment date, and time slot.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      let result;

        const res = await bookingApi.create({
          vehicle_id: Number(selectedVehicleId),
          service_center_id: Number(centerId),
          booking_date: bookingDate,
          time_slot: timeSlot,
          components: selectedServices,
          owner_notes: ownerNotes,
        });
        result = res.booking || res;

      setConfirmedBooking(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not complete your booking request. Please check slot availability.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3 mx-auto"></div>
          <div className="h-64 bg-slate-100 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // --- Success State ---
  if (confirmedBooking) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Booking Confirmed
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Your Service Appointment is Booked!</h1>
          <p className="text-sm text-slate-600 mt-2">
            Reference Booking <strong>#{confirmedBooking.id}</strong> has been created and sent to our central workshop.
          </p>

          <div className="mt-6 p-5 bg-slate-50 rounded-2xl text-left border border-slate-200/80 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-semibold text-slate-900">{selectedVehicle?.reg_no} ({selectedVehicle?.brand} {selectedVehicle?.model})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Slot:</span>
              <span className="font-semibold text-slate-900">{bookingDate} · {timeSlot}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Selected Services:</span>
              <span className="font-semibold text-slate-900">{selectedServices.join(', ')}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="text-slate-700 font-medium">Estimated Bill:</span>
              <span className="font-bold text-blue-700">₹{estimatedTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/customer/bookings')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate('/customer/dashboard')}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- No Vehicles State ---
  if (!vehicles.length) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center bg-white rounded-3xl border border-slate-200 mt-8">
        <Car size={40} className="mx-auto text-slate-400 mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Add a vehicle first</h2>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          To book a maintenance service, register your vehicle in your garage.
        </p>
        <Link
          to="/customer/vehicles"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition"
        >
          Go to My Garage <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Smart Maintenance Booking</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Book Workshop Service</h1>
        <p className="text-sm text-slate-500 mt-1">
          Schedule maintenance, diagnostics, and repairs with guaranteed capacity and transparent pricing.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        {[
          { num: 1, label: 'Choose Vehicle' },
          { num: 2, label: 'Select Services' },
          { num: 3, label: 'Date & Slot' },
          { num: 4, label: 'Review & Confirm' },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => s.num < step && setStep(s.num)}
            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold transition ${
              step === s.num
                ? 'text-blue-600'
                : step > s.num
                ? 'text-emerald-600 hover:underline'
                : 'text-slate-400 cursor-default'
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                step === s.num
                  ? 'bg-blue-600 text-white'
                  : step > s.num
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {step > s.num ? '✓' : s.num}
            </span>
            <span className="hidden sm:inline">{slot.time_slot}{!slot.available && ' · Full'}</span>
          </button>
        ))}
      </div>

      {/* STEP 1: CHOOSE VEHICLE */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Step 1: Select Your Vehicle</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {vehicles.map((v) => {
              const isSelected = String(v.id) === String(selectedVehicleId);
              return (
                <div
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition text-left flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                        {v.fuel_type}
                      </span>
                      {v.overall_status === 'DUE' && (
                        <span className="text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldAlert size={12} /> Service Due
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{v.reg_no}</h3>
                    <p className="text-sm text-slate-600">{v.brand} {v.model} ({v.year})</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Odometer: <strong>{Number(v.current_km || 0).toLocaleString('en-IN')} km</strong></span>
                    <span className={`font-semibold ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                      {isSelected ? 'Selected' : 'Select'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedVehicleId}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              Continue to Services <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELECT SERVICES */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Step 2: Choose Services Needed</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {selectedServices.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICE_CATALOG.map((item) => {
              const isChecked = selectedServices.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleService(item.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
                    isChecked
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">{item.name}</h4>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="h-4 w-4 text-blue-600 rounded border-slate-300 pointer-events-none"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    <p className="text-xs font-semibold text-blue-700 mt-2">
                      Est. ₹{item.estPrice.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Running total banner */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500">Estimated Service Cost:</span>
              <p className="text-lg font-extrabold text-blue-700">₹{estimatedTotal.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-white transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition"
              >
                Choose Slot <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: DATE & TIME SLOT */}
      {step === 3 && (
        <div className="space-y-5">
          <h2 className="text-lg font-bold text-slate-900">Step 3: Appointment Date & Time</h2>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Workshop
            <select
              value={centerId}
              onChange={(event) => { setCenterId(event.target.value); setTimeSlot(''); setSlots([]); }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
            >
              {centers.length === 0 && <option value="">No approved workshops available</option>}
              {centers.map((center) => <option key={center.id} value={center.id}>{center.name} · {center.city}</option>)}
            </select>
          </label>
          {workshopError && <p role="alert" className="text-sm text-red-800">{workshopError}</p>}


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Appointment Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={bookingDate}
                onChange={(e) => { setBookingDate(e.target.value); setTimeSlot(''); setSlots([]); }}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">Bookings are confirmed in real-time.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Available Workshop Slots
              </label>
              <div className="grid grid-cols-2 gap-2">
                {slotsLoading && <p role="status" className="col-span-2 text-sm text-slate-600">Loading time slots…</p>}
                {!slotsLoading && slots.map((slot) => {
                  const isChosen = timeSlot === slot.time_slot;
                  return (
                    <button
                      type="button"
                      key={slot.time_slot}
                      disabled={!slot.available}
                      aria-pressed={isChosen}
                      onClick={() => setTimeSlot(slot.time_slot)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition disabled:opacity-50 ${
                        isChosen
                          ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {slot.time_slot}{!slot.available && ' · Full'}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Specific symptoms or instructions (optional)
            </label>
            <textarea
              rows="3"
              value={ownerNotes}
              onChange={(e) => setOwnerNotes(e.target.value)}
              placeholder="E.g., slight rattling sound when turning, squeaking brake noise on cold mornings..."
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-white transition"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!centerId || !bookingDate || !timeSlot || slotsLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition"
            >
              Review Booking <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Step 4: Review Your Booking</h2>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Vehicle Selected:</span>
              <span className="font-bold text-slate-900 text-base">
                {selectedVehicle?.reg_no} — {selectedVehicle?.brand} {selectedVehicle?.model}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-500">Workshop</span>
              <span className="text-sm font-bold text-slate-900">{selectedCenter?.name}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Appointment Date & Time:</span>
              <span className="font-bold text-slate-900 text-sm">
                {bookingDate} ({timeSlot})
              </span>
            </div>

            <div className="pb-3 border-b border-slate-100">
              <span className="text-sm text-slate-500 block mb-2">Requested Services ({selectedServices.length}):</span>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((s) => (
                  <span key={s} className="bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {ownerNotes && (
              <div className="pb-3 border-b border-slate-100">
                <span className="text-sm text-slate-500 block mb-1">Customer Notes:</span>
                <p className="text-xs text-slate-700 italic bg-slate-50 p-2.5 rounded-lg">{ownerNotes}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-xs text-slate-500">Estimated Total Cost:</span>
                <p className="text-xl font-extrabold text-blue-700">₹{estimatedTotal.toLocaleString('en-IN')}</p>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                Payment after service completion
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-white transition"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-md disabled:opacity-50"
            >
              {submitting ? 'Confirming Appointment…' : 'Confirm & Schedule Service'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
