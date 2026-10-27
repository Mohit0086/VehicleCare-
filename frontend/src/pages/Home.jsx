import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarCheck2, Check, ChevronRight, CircleGauge, ClipboardCheck, Clock3, Leaf, ShieldCheck, Wrench, Activity, CarFront } from 'lucide-react';

const features = [
  { icon: CircleGauge, title: 'Know what your car needs', text: 'See clear maintenance status based on your mileage and service history.' },
  { icon: CalendarCheck2, title: 'Book service without the back-and-forth', text: 'Find a service center, choose a time slot, and follow your booking.' },
  { icon: ClipboardCheck, title: 'Keep every detail together', text: 'Vehicles, service records, documents, bills, and reminders in one place.' },
];

const steps = [
  ['01', 'Add your vehicle', 'Save the details and current odometer reading.'],
  ['02', 'Stay ahead of maintenance', 'Get a simple view of what is due and what is coming up.'],
  ['03', 'Service with confidence', 'Book a workshop and keep the service record and invoice.'],
];

export default function Home() {
  return (
    <div className="overflow-hidden bg-[#f7f8f5] text-slate-900">
      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20 lg:grid lg:min-h-[600px] lg:grid-cols-[1.02fr_.98fr] lg:items-center lg:gap-10 lg:px-10 lg:pb-24">
        <div className="absolute -left-36 top-24 h-80 w-80 rounded-full bg-lime-200/30 blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-lime-200 bg-white/80 px-3.5 py-2 text-xs font-semibold tracking-wide text-slate-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-lime-500" /> A simpler way to care for your car
          </div>
          <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-.055em] sm:text-6xl lg:text-[4.35rem]">Good journeys<br />start with <span className="text-[#4a7c38]">good care.</span></h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Know what your vehicle needs, find a service slot, and keep your maintenance history all in one calm, clear place.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#263b2a] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-[#35533a]">Get started <ArrowRight size={17} /></Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">Sign in <ArrowUpRight size={16} /></Link>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#4a7c38]" /> Maintenance reminders</span>
            <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#4a7c38]" /> Service booking</span>
            <span className="inline-flex items-center gap-2"><Check size={15} className="text-[#4a7c38]" /> Digital records</span>
          </div>
        </div>

        <div className="relative mx-auto mt-14 w-full max-w-xl lg:mt-0">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#dce9cd]" />
          <div className="absolute -bottom-10 -left-8 h-44 w-44 rounded-full bg-[#e8eee2]" />
          <div className="relative overflow-hidden rounded-[2rem] bg-[#263b2a] p-5 shadow-2xl shadow-emerald-950/15 sm:p-7">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#d9e8ce 1px, transparent 1px)', backgroundSize: '19px 19px' }} />
            <div className="relative rounded-[1.5rem] bg-[#f9faf7] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-xs font-medium text-slate-500">YOUR GARAGE</p><h2 className="mt-1 text-xl font-semibold tracking-tight">A little peace of mind.</h2></div>
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e7efdf] text-[#4a7c38]"><CarFront size={20} /></div>
              </div>
              <div className="mt-5 rounded-2xl bg-[#e9eee4] p-5">
                <div className="flex items-center justify-between"><span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-600">YOUR VEHICLE</span><ChevronRight size={17} className="text-slate-500" /></div>
                <div className="mt-5 flex items-end justify-between">
                  <div><p className="text-2xl font-semibold tracking-tight">Ready for the road</p><p className="mt-1 text-sm text-slate-600">Your car care, at a glance</p></div>
                  <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#537946] shadow-sm"><Wrench size={22} /></div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Activity size={15} /> VEHICLE HEALTH</div><p className="mt-3 text-lg font-semibold">On track</p><p className="mt-1 text-xs text-slate-500">Stay on top of routine care</p></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Clock3 size={15} /> NEXT STEP</div><p className="mt-3 text-lg font-semibold">Your schedule</p><p className="mt-1 text-xs text-slate-500">Book when it works for you</p></div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#263b2a] px-4 py-3.5 text-white"><div className="grid h-9 w-9 place-items-center rounded-full bg-white/10"><ShieldCheck size={18} /></div><p className="text-xs leading-5 text-white/85">Your service history stays organized, ready when you need it.</p><ArrowRight size={16} className="ml-auto shrink-0" /></div>
            </div>
          </div>
          <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 translate-x-1/2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl sm:block"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-lime-50 text-lime-700"><Leaf size={18} /></div><div><p className="text-xs font-semibold">Care that goes further</p><p className="mt-0.5 text-[11px] text-slate-500">Better upkeep, cleaner journeys</p></div></div></div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#628451]">CAR CARE, MADE CLEAR</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Everything your vehicle needs, in one place.</h2><p className="mt-4 leading-7 text-slate-600">Less guesswork about maintenance. A more organized way to manage the details that keep you moving.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-3xl border border-slate-200 bg-[#fbfcfa] p-6 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf1e5] text-[#537946]"><Icon size={22} /></div><h3 className="mt-5 text-lg font-semibold tracking-tight">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#628451]">THREE EASY STEPS</p><h2 className="mt-3 max-w-md text-3xl font-semibold tracking-[-.04em] sm:text-4xl">From first check to next drive.</h2><p className="mt-4 max-w-md leading-7 text-slate-600">A clear routine for managing your vehicle, whether you are booking a service or checking what is due.</p><Link to="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#456e38] hover:text-[#2f5426]">Create your account <ArrowRight size={16} /></Link></div>
          <div className="space-y-3">{steps.map(([number, title, text]) => <div key={number} className="flex gap-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><span className="pt-0.5 text-sm font-semibold text-[#78936c]">{number}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div></div>)}</div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[2rem] bg-[#263b2a] px-7 py-9 text-white sm:px-10 sm:py-11 md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-lime-200">READY WHEN YOU ARE</p><h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Take better care of every drive.</h2><p className="mt-2 text-sm text-white/70">Start building a clearer picture of your vehicle’s needs.</p></div><Link to="/register" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#263b2a] transition hover:bg-lime-50">Get started <ArrowRight size={16} /></Link></div></section>
      <footer className="border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><span className="font-semibold text-slate-700">VehicleCare</span><span>Thoughtful maintenance for the miles ahead.</span><span className="inline-flex items-center gap-1.5"><Leaf size={13} className="text-[#628451]" /> Care for your car. Consideration for our cities.</span></div></footer>
    </div>
  );
}
