import React from 'react';
import { NavLink } from 'react-router-dom';

export default function RegistrationOptions() {
  return (
    <nav aria-label="Account type" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
      {[
        ['/register', 'User'],
        ['/register-garage', 'Garage'],
      ].map(([path, label]) => (
        <NavLink
          key={path}
          to={path}
          end
          className={({ isActive }) =>
            `flex min-h-10 items-center justify-center rounded-lg px-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${
              isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-700 hover:bg-slate-200'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
