import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays, Gauge, FolderCheck } from 'lucide-react';

export const carPhoto = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1800&q=85';

const services = [
  { number: '01', icon: Gauge, title: 'Know what’s due.', text: 'Oil, brakes, tyres and the rest. Check maintenance against your mileage and last service date.', link: 'Track your vehicle' },
  { number: '02', icon: CalendarDays, title: 'Make time for service.', text: 'Choose a workshop and an available slot. Follow your booking from request to completed job.', link: 'Plan your next visit' },
  { number: '03', icon: FolderCheck, title: 'Keep the paperwork.', text: 'Find your service history, invoices, insurance and PUC expiry dates without searching through a folder.', link: 'Organize your records' },
];

export default function Home() {
  return (
    <main className="motoring-home">
      <section className="motoring-hero">
        <div className="hero-copy">
          <p className="motoring-kicker"><span /> YOUR CAR. THE FULL PICTURE.</p>
          <h1>A little care.<br />A lot more<br /><em>road ahead.</em></h1>
          <p className="hero-description">Keep track of the small things that keep your car going. Maintenance, workshop visits and service records, all in your own garage.</p>
          <div className="hero-actions"><Link to="/register" className="motoring-button">Set up my garage <ArrowRight size={18} /></Link><Link to="/login" className="motoring-text-link">Already a member? Sign in <ArrowUpRight size={16} /></Link></div>
          <div className="hero-footnote"><span>BUILT FOR EVERYDAY OWNERSHIP</span><p>From your daily commute to the long way home.</p></div>
        </div>
        <figure className="hero-photograph">
          <img src={carPhoto} alt="Grey sports car parked on an open road, viewed from the front" fetchPriority="high" width="1800" height="1200" />
          <figcaption><span>01 / THE OPEN ROAD</span><p>Look after the car.<br />Enjoy the drive.</p><span className="photo-rule" /></figcaption>
        </figure>
      </section>
      <div className="motoring-index"><span>LESS TO REMEMBER. MORE MILES TO ENJOY.</span><a href="#car-care">Explore VehicleCare <ArrowRight size={16} /></a></div>
      <section id="car-care" className="motoring-services">
        <div className="services-heading"><p className="motoring-kicker">THE OWNERSHIP ESSENTIALS</p><h2>Good upkeep.<br />Without the guesswork.</h2><p>A practical place for everything that happens between one service and the next.</p></div>
        <div className="services-list">{services.map(({ number, icon: Icon, title, text, link }) => <article key={number}><div className="service-topline"><span>{number}</span><Icon size={24} strokeWidth={1.4} /></div><h3>{title}</h3><p>{text}</p><Link to="/register">{link}<ArrowUpRight size={17} /></Link></article>)}</div>
      </section>
      <section className="motoring-closing"><div><p className="motoring-kicker">START WITH YOUR REGISTRATION NUMBER</p><h2>Your next chapter.<br />Better maintained.</h2></div><div><p>Add your vehicle and current mileage.<br />We’ll help you keep up with what comes next.</p><Link to="/register" className="motoring-button">Create an account <ArrowRight size={18} /></Link></div></section>
      <footer className="motoring-footer"><Link to="/" className="brand">Vehicle<span className="brand-accent">Care</span></Link><p>Vehicle maintenance & service management</p><span>SISTec, Bhopal · {new Date().getFullYear()}</span></footer>
    </main>
  );
}
