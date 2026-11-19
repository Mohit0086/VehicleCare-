import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Car,
  Gauge,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ArrowLeft,
  RefreshCw,
  Wrench,
  FileText,
  Activity,
  History,
  CheckCircle2,
  UploadCloud,
  FileCheck2,
} from 'lucide-react';
import { vehicleApi } from '../../api/vehicle.api';
import { documentApi } from '../../api/document.api';
import EstimateSummary from '../../components/EstimateSummary';
import { predictionApi } from '../../api/prediction.api';

export default function CustomerVehicleDetail() {
  const { id } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [odometerLogs, setOdometerLogs] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [prediction, setPrediction] = useState(null);

  const [activeTab, setActiveTab] = useState('maintenance');
  const [loading, setLoading] = useState(true);

  // Odometer update form
  const [newOdometer, setNewOdometer] = useState('');
  const [updatingOdo, setUpdatingOdo] = useState(false);
  const [odoMsg, setOdoMsg] = useState({ text: '', type: '' });

  // Document upload form
  const [docType, setDocType] = useState('INSURANCE');
  const [docFile, setDocFile] = useState(null);
  const [docExpiry, setDocExpiry] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docMsg, setDocMsg] = useState({ text: '', type: '' });

  const loadVehicleData = async () => {


    try {
      setLoading(true);
      const [vRes, mRes, hRes, oRes, dRes, pRes] = await Promise.allSettled([
        vehicleApi.get(id),
        vehicleApi.maintenance(id),
        vehicleApi.getServiceHistory ? vehicleApi.getServiceHistory(id) : Promise.resolve({ history: [] }),
        vehicleApi.odometerLog(id),
        documentApi.list(id),
        predictionApi.getPrediction(id),
      ]);

      if (vRes.status === 'fulfilled') {
        const v = vRes.value?.vehicle || vRes.value;
        setVehicle(v);
        setNewOdometer(String(v?.current_km || ''));
      }
      if (mRes.status === 'fulfilled') {
        setMaintenance(mRes.value?.maintenance || mRes.value?.components || []);
      }
      if (hRes.status === 'fulfilled') {
        setServiceHistory(hRes.value?.history || []);
      }
      if (oRes.status === 'fulfilled') {
        setOdometerLogs(oRes.value?.logs || []);
      }
      if (dRes.status === 'fulfilled') {
        setDocuments(dRes.value?.documents || []);
      }
      if (pRes.status === 'fulfilled') {
        setPrediction(pRes.value?.prediction || pRes.value);
      }
    } catch (e) {
      console.warn('Failed to load vehicle details', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicleData();
  }, [id]);

  // Handle Monotonic Odometer Update (FR-9)
  const handleOdometerUpdate = async (e) => {
    e.preventDefault();
    setOdoMsg({ text: '', type: '' });

    const odoValue = Number(newOdometer);
    if (isNaN(odoValue) || odoValue < (vehicle?.current_km || 0)) {
      setOdoMsg({
        text: `New odometer value must be at least ${Number(vehicle?.current_km || 0).toLocaleString('en-IN')} km.`,
        type: 'error',
      });
      return;
    }

    setUpdatingOdo(true);
    try {

        await vehicleApi.updateOdometer(id, odoValue);
        setOdoMsg({ text: 'Odometer updated successfully! System re-evaluated component health.', type: 'success' });
        await loadVehicleData();

    } catch (err) {
      setOdoMsg({
        text: err.response?.data?.error || 'Failed to update odometer.',
        type: 'error',
      });
    } finally {
      setUpdatingOdo(false);
    }
  };

  // Handle Document Upload (FR-29)
  const handleDocUpload = async (e) => {
    e.preventDefault();
    setDocMsg({ text: '', type: '' });
    if (!docFile) {
      setDocMsg({ text: 'Please select a PDF, PNG, or JPG file.', type: 'error' });
      return;
    }

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append('file', docFile);
    formData.append('doc_type', docType);
    if (docExpiry) formData.append('expiry_date', docExpiry);

    try {

        await documentApi.upload(id, formData);
        setDocMsg({ text: 'Document uploaded successfully.', type: 'success' });
        await loadVehicleData();

      setDocFile(null);
      setDocExpiry('');
    } catch (err) {
      setDocMsg({ text: err.response?.data?.error || 'Failed to upload document.', type: 'error' });
    } finally {
      setUploadingDoc(false);
    }
  };

  if (loading || !vehicle) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6 animate-pulse">
        <div className="h-40 bg-slate-100 rounded-3xl"></div>
        <div className="h-64 bg-slate-100 rounded-3xl"></div>
      </div>
    );
  }

  const isDue = vehicle.overall_status === 'DUE';
  const isDueSoon = vehicle.overall_status === 'DUE_SOON';

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        to="/customer/vehicles"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={14} /> Back to My Garage
      </Link>

      {/* Vehicle Hero Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Car size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{vehicle.reg_no}</h1>
              <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                {vehicle.fuel_type}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isDue
                    ? 'bg-red-100 text-red-700'
                    : isDueSoon
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isDue ? 'Service Due' : isDueSoon ? 'Due Soon' : 'Up to Date'}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1 font-medium">
              {vehicle.brand} {vehicle.model} · Model Year {vehicle.year}
            </p>
          </div>
        </div>

        {/* Odometer Quick Update Widget */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Odometer (km)</span>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min={vehicle.current_km}
                value={newOdometer}
                onChange={(e) => setNewOdometer(e.target.value)}
                className="w-32 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                onClick={handleOdometerUpdate}
                disabled={updatingOdo}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw size={13} className={updatingOdo ? 'animate-spin' : ''} />
                {updatingOdo ? 'Saving…' : 'Update'}
              </button>
            </div>
            {odoMsg.text && (
              <p
                className={`text-[11px] mt-1.5 font-medium ${
                  odoMsg.type === 'error' ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {odoMsg.text}
              </p>
            )}
          </div>
          <Link
            to={`/customer/book?vehicleId=${vehicle.id}`}
            className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition text-center shrink-0"
          >
            Book Service
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        {[
          { key: 'maintenance', label: 'Component Health', icon: Wrench },
          { key: 'history', label: 'Service History', icon: History },
          { key: 'odometer', label: 'Odometer Audit', icon: Gauge },
          { key: 'prediction', label: 'Maintenance estimates', icon: Activity },
          { key: 'documents', label: 'Documents', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMPONENT MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-base">Tracked Vehicle Components (8 Core Systems)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Based on distance driven and time since the last recorded service.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Component</th>
                  <th className="p-4">Last Done</th>
                  <th className="p-4">Next Due (km)</th>
                  <th className="p-4">Remaining</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {maintenance.map((m, idx) => {
                  const compStatus = m.status || 'OK';
                  const isCompDue = compStatus === 'DUE';
                  const isCompSoon = compStatus === 'DUE_SOON';
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="p-4 font-bold text-slate-900">{m.name || m.component}</td>
                      <td className="p-4 text-slate-600">
                        {Number(m.last_done_km || 0).toLocaleString('en-IN')} km
                        <span className="block text-[11px] text-slate-400">{m.last_done_date || 'Baseline'}</span>
                      </td>
                      <td className="p-4 text-slate-700 font-semibold">
                        {m.next_due_km ? `${Number(m.next_due_km).toLocaleString('en-IN')} km` : '—'}
                      </td>
                      <td className="p-4 text-slate-700">
                        {m.remaining_km != null ? (
                          <span className={m.remaining_km <= 0 ? 'text-red-600 font-bold' : ''}>
                            {m.remaining_km <= 0 ? `${Math.abs(m.remaining_km)} km overdue` : `${m.remaining_km} km left`}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            isCompDue
                              ? 'bg-red-100 text-red-700'
                              : isCompSoon
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isCompDue ? 'DUE' : isCompSoon ? 'DUE SOON' : 'UP TO DATE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          to={`/customer/book?vehicleId=${vehicle.id}&component=${encodeURIComponent(m.name || '')}`}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-semibold text-xs rounded-lg transition"
                        >
                          Book Service
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICE HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-base">Completed Service Visits & Work Done</h3>
          </div>
          {serviceHistory.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No completed service visits on record yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 text-sm">
              {serviceHistory.map((h, i) => (
                <div key={i} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <span className="text-xs font-bold text-blue-600">{h.service_date}</span>
                    <h4 className="font-bold text-slate-900 mt-0.5">{h.center_name || 'VehicleCare Central Workshop'}</h4>
                    <p className="text-xs text-slate-600 mt-1">{h.work_done || 'Periodic maintenance and inspection'}</p>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      Odometer at service: {Number(h.odometer_at_service || 0).toLocaleString('en-IN')} km
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-extrabold text-slate-900">₹{Number(h.total_amount || 0).toLocaleString('en-IN')}</p>
                    {h.bill_id && (
                      <Link
                        to={`/customer/invoices`}
                        className="text-xs text-blue-600 font-semibold hover:underline block mt-1"
                      >
                        Download PDF Invoice →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ODOMETER AUDIT LOG */}
      {activeTab === 'odometer' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-base">Odometer history</h3>
            <p className="text-xs text-slate-500">Every change is audited with timestamp, reading, and source.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Logged Date</th>
                  <th className="p-4">Reading</th>
                  <th className="p-4">Source</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {odometerLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-4 text-slate-600">{new Date(log.recorded_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-4 font-bold text-slate-900">{Number(log.reading_km).toLocaleString('en-IN')} km</td>
                    <td className="p-4">
                      <span className="text-xs font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {log.source}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'prediction' && (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Maintenance estimates</h3>
          <EstimateSummary prediction={prediction} fuelType={vehicle.fuel_type} />
        </section>
      )}

      {/* TAB 5: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Upload Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Upload Vehicle Document (RC, Insurance, PUC)</h3>
            {docMsg.text && (
              <p className={`text-xs font-semibold ${docMsg.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
                {docMsg.text}
              </p>
            )}
            <form onSubmit={handleDocUpload} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Doc Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                >
                  <option value="INSURANCE">Insurance</option>
                  <option value="PUC">PUC Certificate</option>
                  <option value="RC">RC (Registration)</option>
                  <option value="OTHER">Other Invoice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={docExpiry}
                  onChange={(e) => setDocExpiry(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select File (PDF/Image)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => setDocFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={uploadingDoc}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <UploadCloud size={15} />
                {uploadingDoc ? 'Uploading…' : 'Upload'}
              </button>
            </form>
          </div>

          {/* Document List */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Attached Documents ({documents.length})
            </div>
            {documents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No documents uploaded for this vehicle yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                {documents.map((doc, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCheck2 size={20} className="text-blue-600" />
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{doc.doc_type}</span>
                        <p className="text-xs text-slate-500">{doc.original_filename}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      {doc.expiry_date && (
                        <span className="text-slate-500">Expires: <strong>{doc.expiry_date}</strong></span>
                      )}
                      <a
                        href={doc.download_url || `/api/documents/${doc.id}/download`}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
