import React from 'react';

export default function ChartCard({ title, subtitle, children }) {
  return (
    <section className="panel chart-card p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="h-64 w-full">
        {children}
      </div>
    </section>
  );
}
