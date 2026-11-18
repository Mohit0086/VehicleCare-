import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, UploadCloud, FileCheck2, Car, Calendar, ArrowRight } from 'lucide-react';
import { vehicleApi } from '../../api/vehicle.api';
import { documentApi } from '../../api/document.api';

export default function CustomerDocuments() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload form
  const [docType, setDocType] = useState('INSURANCE');
  const [docFile, setDocFile] = useState(null);
  const [docExpiry, setDocExpiry] = useState('');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    async function loadData() {

      try {
        const res = await vehicleApi.list();
        const vList = res.vehicles || res.data || [];
        setVehicles(vList);
        if (vList.length > 0) {
          setSelectedVehicleId(vList[0].id);
          const dRes = await documentApi.list(vList[0].id);
          setDocuments(dRes.documents || []);
        }
      } catch (err) {
        console.warn('Doc page error', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleVehicleChange = async (vId) => {
    setSelectedVehicleId(vId);
    try {
      const dRes = await documentApi.list(vId);
      setDocuments(dRes.documents || []);
    } catch {
      setDocuments([]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!docFile || !selectedVehicleId) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', docFile);
    fd.append('doc_type', docType);
    if (docExpiry) fd.append('expiry_date', docExpiry);

    try {

        await documentApi.upload(selectedVehicleId, fd);
        const dRes = await documentApi.list(selectedVehicleId);
        setDocuments(dRes.documents || []);
        setMsg('Document uploaded successfully.');

      setDocFile(null);
      setDocExpiry('');
    } catch (err) {
      setMsg(err.response?.data?.error || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Compliance & Records</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Vehicle Documents</h1>
        <p className="text-sm text-slate-500 mt-1">
          Store insurance policies, PUC certificates, and registration cards securely.
        </p>
      </div>

      {vehicles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Car size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-900 text-base">Add a vehicle first</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Documents are attached to specific vehicles in your garage.</p>
          <Link to="/customer/vehicles" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-xs">
            Go to Garage
          </Link>
        </div>
      ) : (
        <>
          {/* Select vehicle selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase">Select Active Vehicle:</span>
            <select
              value={selectedVehicleId}
              onChange={(e) => handleVehicleChange(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.reg_no} — {v.brand} {v.model}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Upload New Document</h3>
            {msg && <p className="text-xs font-semibold text-blue-700">{msg}</p>}

            <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium"
                >
                  <option value="INSURANCE">Insurance Policy</option>
                  <option value="PUC">PUC Certificate</option>
                  <option value="RC">Registration Certificate (RC)</option>
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">File (PDF/Image)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={(e) => setDocFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <UploadCloud size={15} />
                {uploading ? 'Uploading…' : 'Save Document'}
              </button>
            </form>
          </div>

          {/* Document list */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
              Attached Documents for Selected Vehicle ({documents.length})
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
        </>
      )}
    </div>
  );
}
