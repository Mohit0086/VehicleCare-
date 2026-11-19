import React from 'react';

export default function AuthLayout({ title, description, wide = false, children }) {
  return (
    <main className="auth-layout">
      <div className="auth-photo" aria-hidden="true">
        <img
          src="/images/workshop-car.webp"
          alt=""
          width="1200"
          height="900"
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
