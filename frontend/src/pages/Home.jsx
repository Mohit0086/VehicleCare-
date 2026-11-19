import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Gauge, FolderCheck } from 'lucide-react';

const features = [
  { icon: Gauge, title: 'Maintenance reminders', text: 'See which services are due based on your odometer and service history.' },
  { icon: CalendarDays, title: 'Workshop bookings', text: 'Choose a workshop and request an available slot. Check back for its response.' },
  { icon: FolderCheck, title: 'Vehicle records', text: 'Keep service history, invoices, and insurance and PUC expiry dates together.' },
];

export default function Home() {
  return (
    <main className="bg-[#faf9f5] text-slate-900">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <section className="grid items-center gap-8 py-8 sm:py-12 lg:grid-cols-2 lg:gap-12 lg:py-16">
          <div>
            <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight sm:text-5xl xl:text-6xl">
              Track maintenance. <span className="font-['Libre_Caslon_Display',Georgia,serif] font-normal text-primary">Book a service.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600">
              Add your vehicles, see what’s due, and keep your workshop bookings and invoices in one place.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link to="/register" className="button button-primary min-h-11 gap-3 px-5 text-sm">
                Create a customer account <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/register-garage" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
                Register a garage
              </Link>
            </div>
          </div>
          <img
            src="/images/workshop-car.webp"
            alt=""
            width="1200"
            height="900"
            fetchPriority="high"
            className="aspect-[4/3] w-full rounded-lg bg-[#252e29] object-cover"
          />
        </section>

        <section aria-label="Features" className="grid gap-y-6 border-t border-[#dcdcd2] py-8 sm:py-10 md:grid-cols-3 md:gap-8">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="border-b border-[#dcdcd2] pb-6 last:border-b-0 last:pb-0 md:border-b-0 md:pb-0">
              <Icon size={21} strokeWidth={1.7} className="text-primary" aria-hidden="true" />
              <h2 className="mt-3 text-lg font-semibold">{title}</h2>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-600">{text}</p>
            </article>
          ))}
        </section>

        <footer className="border-t border-[#dcdcd2] py-6 text-sm text-slate-600">
          VehicleCare
        </footer>
      </div>
    </main>
  );
}
