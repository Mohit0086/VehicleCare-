import React from 'react';

export default function EstimateSummary({ prediction, fuelType }) {
  if (!prediction) {
    return <p className="text-sm text-slate-600">Estimates unavailable. Try refreshing.</p>;
  }

  const distance = (value) => Number.isFinite(value) ? `${value.toLocaleString('en-IN')} km` : 'Unavailable';
  const cost = prediction.estimated_cost;
  const estimates = [
    ['Oil change in', fuelType === 'ELECTRIC' ? 'Not applicable' : distance(prediction.oil_change_km)],
    ['Brake inspection in', distance(prediction.brake_inspection_km)],
    ['Estimated cost', Number.isFinite(cost) ? `₹${cost.toLocaleString('en-IN')}` : 'Unavailable'],
  ];

  return (
    <div className="space-y-3">
      <dl className="grid gap-2 sm:grid-cols-3">
        {estimates.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-50 px-3 py-2.5">
            <dt className="text-xs text-slate-600">{label}</dt>
            <dd className="mt-1 text-sm font-semibold tabular-nums text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs leading-relaxed text-slate-600">
        {prediction.fallback ? 'Rule-based estimate.' : 'Estimate from a model trained on synthetic data.'}{' '}
        Follow your manufacturer’s service schedule and ask your workshop for a quote.
      </p>
    </div>
  );
}
