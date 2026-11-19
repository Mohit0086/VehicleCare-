import React, { useState, useEffect } from 'react';
import { FileDown, ReceiptText, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { billApi } from '../../api/bill.api';

export default function CustomerInvoices() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBills() {

      try {
        setLoading(true);
        const res = await billApi.list();
        setBills(res.bills || res.invoices || []);
      } catch {
        setBills([]);
      } finally {
        setLoading(false);
      }
    }
    loadBills();
  }, []);

  const handleDownloadPdf = async (bill) => {
    setDownloadingId(bill.id);
    setError('');
    try {

      const blob = await billApi.download(bill.id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${bill.bill_no || `invoice-${bill.id}`}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Could not generate PDF invoice. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Invoices</h1>
        <p className="text-sm text-slate-500 mt-1">
          Download PDF invoices for completed periodic maintenance and workshop jobs.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl flex items-center gap-2 border border-red-100">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-3xl"></div>
          ))}
        </div>
      ) : bills.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <ReceiptText size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-900 text-base">No invoices found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Once the workshop completes a service booking and generates a bill, your invoice will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Workshop</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-900">{b.bill_no}</td>
                    <td className="p-4 text-slate-500">
                      {b.generated_at ? new Date(b.generated_at).toLocaleDateString('en-IN') : 'Unavailable'}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{b.reg_no}</td>
                    <td className="p-4 text-slate-600">{b.center_name || 'Workshop unavailable'}</td>
                    <td className="p-4 font-extrabold text-slate-900">
                      ₹{Number(b.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${b.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                        {b.payment_status === 'PAID' ? 'Paid' : b.payment_status === 'PENDING' ? 'Payment pending' : 'Status unavailable'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDownloadPdf(b)}
                        disabled={downloadingId === b.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-semibold text-xs rounded-xl transition disabled:opacity-50"
                      >
                        <FileDown size={14} />
                        {downloadingId === b.id ? 'Generating…' : 'PDF Invoice'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
