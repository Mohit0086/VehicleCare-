import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CarFront, Menu, Home, UserPlus, LayoutDashboard, Car, CalendarDays, ReceiptText, BellRing, FileText, Wrench, ClipboardList, CheckCircle2, Users, Building2, Settings2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleLinks = {
  OWNER: [
    ['Dashboard', '/owner/dashboard', LayoutDashboard], ['My Vehicles', '/owner/vehicles', Car], ['Bookings', '/owner/bookings', CalendarDays],
    ['Invoices', '/owner/invoices', ReceiptText], ['Reminders', '/owner/reminders', BellRing], ['Documents', '/owner/documents', FileText],
  ],
  MECHANIC: [
    ['Job Queue', '/mechanic/jobs', ClipboardList], ['Active Jobs', '/mechanic/jobs/active', Wrench], ['Completed Jobs', '/mechanic/completed', CheckCircle2], ['Profile', '/mechanic/profile', Users],
  ],
  ADMIN: [
    ['Dashboard', '/admin/dashboard', LayoutDashboard], ['Users', '/admin/users', Users], ['Service Centers', '/admin/centers', Building2],
    ['Service Intervals', '/admin/intervals', Settings2], ['All Bookings', '/admin/bookings', CalendarDays],
  ],
};
const homeFor = (role) => role === 'ADMIN' ? '/admin/dashboard' : role === 'MECHANIC' ? '/mechanic/jobs' : '/owner/dashboard';

export default function Navbar() {
  const { user, logout, isAuthenticated, isPreview } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const links = roleLinks[user?.role] || [];
  const leavePreview = (path) => { logout(); setOpen(false); navigate(path, { replace: true }); };
  if (!isAuthenticated || !user) return <header className="site-header"><Link to="/" className="brand"><span className="brand-mark"><CarFront size={20}/></span><span>Vehicle<span className="brand-accent">Care</span></span></Link><div className="flex items-center gap-3"><Link className="top-link" to="/login">Sign in</Link><Link className="button button-primary button-sm" to="/register">Get started</Link></div></header>;
  return <>
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <Link to={homeFor(user.role)} className="brand sidebar-brand" onClick={() => setOpen(false)}><span className="brand-mark"><CarFront size={20}/></span><span>Vehicle<span className="brand-accent">Care</span></span></Link>
      <div className="nav-caption">WORKSPACE</div>
      <nav aria-label={`${user.role.toLowerCase()} navigation`} className="side-links">{links.map(([label, to, Icon]) => <NavLink key={label} to={to} end={to === '/owner/dashboard' || to === '/admin/dashboard' || to === '/mechanic/jobs'} onClick={() => setOpen(false)} className={({isActive}) => `side-link ${isActive ? 'side-link-active' : ''}`}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="support-note"><span className="support-dot"/><div><strong>VehicleCare support</strong><small>Here for the road ahead</small></div></div>{isPreview&&<div className="preview-nav"><div className="preview-nav-label">LEAVE PREVIEW</div><button type="button" className="side-link preview-nav-button" onClick={() => leavePreview('/')}><Home size={17}/><span>Home page</span></button><button type="button" className="side-link preview-nav-button" onClick={() => leavePreview('/register')}><UserPlus size={17}/><span>Register</span></button></div>}<button className="side-link logout-link" onClick={() => { leavePreview(isPreview?'/':'/login'); }}><LogOut size={18}/><span>{isPreview?'Exit preview':'Sign out'}</span></button></div>
    </aside>
    {open && <button className="drawer-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <div className="app-main"><header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu size={21}/></button><div className="topbar-context"><span className="topbar-eyebrow">{isPreview ? 'LOCAL UI PREVIEW' : (user.serviceCenter?.name || 'YOUR GARAGE')}</span><span className="topbar-page">{links.find(([_,to]) => location.pathname === to)?.[0] || 'VehicleCare'}</span></div><div className="topbar-actions">{isPreview&&<button type="button" className="button button-secondary preview-home-action" onClick={()=>leavePreview('/')}><Home size={15}/>Home</button>}{user.role === 'OWNER' && <Link to="/owner/reminders" className="icon-button notification-button" aria-label="View reminders"><Bell size={19}/><i/></Link>}<div className="user-chip"><span className="avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span><div className="user-meta"><strong>{user.name}</strong><span>{user.role}</span></div></div></div></header><div className="page-body">{/* route content follows */}</div></div>
  </>;
}
export { homeFor };

