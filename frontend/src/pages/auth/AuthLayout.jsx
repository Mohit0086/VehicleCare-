import React from 'react';

export default function AuthLayout({ title, description, wide = false, children }) {
  return (
    <main className="auth-layout">
      <div className="auth-photo" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80"
          alt=""
          width="900"
          height="1200"
        />
      </div>
      <div className={`auth-card ${wide ? 'auth-card-wide' : ''}`}>
        <header>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </header>
        {children}
      </div>
    </main>
  );
}
