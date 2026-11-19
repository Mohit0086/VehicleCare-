import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  CarFront,
  Menu,
  Home,
  UserPlus,
  LayoutDashboard,
  Car,
  CalendarDays,
  ReceiptText,
  BellRing,
  FileText,
  Activity,
  Wrench,
  Users,
  Settings2,
  LogOut,
  Building2,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const roleLinks = {
  CUSTOMER: [
    ['Dashboard', '/customer/dashboard', LayoutDashboard],
    ['My Garage', '/customer/vehicles', Car],
    ['Book Service', '/customer/book', PlusCircle],
    ['My Bookings', '/customer/bookings', CalendarDays],
    ['Invoices', '/customer/invoices', ReceiptText],
    ['Maintenance estimates', '/customer/predictions', Activity],
    ['Documents', '/customer/documents', FileText],
    ['Reminders', '/customer/reminders', BellRing],
  ],
  GARAGE: [['Bookings', '/garage/bookings', Wrench]],
  ADMIN: [
    ['Dashboard', '/admin/dashboard', LayoutDashboard],
    ['Workshop bookings', '/admin/bookings', Wrench],
    ['Customers', '/admin/customers', Users],
    ['Service Intervals', '/admin/intervals', Settings2],
    ['Workshops', '/admin/centers', Building2],
  ],
};

const homeFor = (role) => ({ ADMIN: '/admin/dashboard', MECHANIC: '/admin/dashboard', GARAGE: '/garage/bookings' })[role] || '/customer/dashboard';
const portalNames = { ADMIN: 'Administration', GARAGE: 'Garage portal', CUSTOMER: 'Customer portal' };

export default function Navbar({ children }) {
  const { user, logout, isAuthenticated, role } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const activeRole = role || 'CUSTOMER';
  const links = roleLinks[activeRole] || roleLinks.CUSTOMER;

  const handleExit = (path) => {
    logout();
    setOpen(false);
    navigate(path, { replace: true });
  };

  if (!isAuthenticated || !user) {
    return (
      <>
        <header className="site-header">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <CarFront size={20} />
            </span>
            <span>
              Vehicle<span className="brand-accent">Care</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link className="top-link" to="/login">
              Sign in
            </Link>
            <Link className="button button-primary button-sm" to="/register">
              Create account
            </Link>
          </div>
        </header>
        {children}
      </>
    );
  }

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <Link to={homeFor(user.role)} className="brand sidebar-brand" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            <CarFront size={20} />
          </span>
          <span>
            Vehicle<span className="brand-accent">Care</span>
          </span>
        </Link>

        <div className="nav-caption">{portalNames[activeRole].toUpperCase()}</div>

        <nav aria-label={`${activeRole.toLowerCase()} navigation`} className="side-links">
          {links.map(([label, to, Icon]) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/customer/dashboard' || to === '/admin/dashboard'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `side-link ${isActive ? 'side-link-active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-note">
            <span className="support-dot" />
            <div>
              <strong>SISTec VehicleCare</strong>
              <small>Smart Maintenance System</small>
            </div>
          </div>

          <button
            className="side-link logout-link"
            onClick={() => handleExit('/login')}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {open && <button className="drawer-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}

      <div className="app-main">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setOpen(true)}>
            <Menu size={21} />
          </button>

          <div className="topbar-context">
            <span className="topbar-eyebrow">
              {portalNames[activeRole].toUpperCase()}
            </span>
            <span className="topbar-page">
              {links.find(([_, to]) => location.pathname === to)?.[0] || 'VehicleCare'}
            </span>
          </div>

          <div className="topbar-actions flex items-center gap-3">
            {/* Prompt Notification Bell */}
            <NotificationDropdown customerTools={activeRole === 'CUSTOMER'} />

            {/* User Profile Pill */}
            <div className="user-chip">
              <span className="avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              <div className="user-meta">
                <strong>{user.name}</strong>
                <span>{activeRole}</span>
              </div>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </>
  );
}

export { homeFor };
