import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Car, RefreshCw, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { vehicleApi } from '../../api/vehicle.api';
import { predictionApi } from '../../api/prediction.api';

export default function CustomerPredictions() {
  const [vehicles, setVehicles] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      let vList = [];

        const res = await vehicleApi.list();
        vList = res.vehicles || res.data || [];

      setVehicles(vList);

      const predMap = {};
      for (const v of vList) {

          try {
            const p = await predictionApi.getPrediction(v.id);
            predMap[v.id] = p.prediction || p;
          } catch {
            predMap[v.id] = null;
          }

      }
      setPredictions(predMap);
    } catch (err) {
      console.warn('Prediction load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Predictive Machine Learning</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Vehicle Health Predictions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Machine learning models forecasting oil life, brake pad wear, and expected repair bills.
          </p>
        </div>
        <button
          onClick={loadPredictions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Estimates
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
          <Car size={40} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-900 text-base">No vehicles found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Add a vehicle to generate machine learning forecasts.</p>
          <Link to="/customer/vehicles" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-xs">
            Go to Garage
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.map((v) => {
            const p = predictions[v.id];
            return (
              <div key={v.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {v.fuel_type}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-2">{v.reg_no}</h3>
                    <p className="text-xs text-slate-500">
                      {v.brand} {v.model} ({v.year}) · {Number(v.current_km || 0).toLocaleString('en-IN')} km
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5 pt-2">
                  <div className="p-3 bg-slate-50 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Oil Change</span>
                    <strong className="text-base text-blue-700 font-black mt-1 block">
                      ~{p ? p.oil_change_km : '—'} km
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Brakes</span>
                    <strong className="text-base text-indigo-700 font-black mt-1 block">
                      ~{p ? p.brake_inspection_km : '—'} km
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Est. Bill</span>
                    <strong className="text-base text-emerald-700 font-black mt-1 block">
                      ₹{p ? Number(p.estimated_cost).toLocaleString('en-IN') : '—'}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400">
                    {!p ? 'Estimate unavailable. Try refreshing.' : p.fallback ? 'Rule-based estimate' : 'Approximate model estimate'}
                  </span>
                  <Link
                    to={`/customer/book?vehicleId=${v.id}`}
                    className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Schedule Service <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
