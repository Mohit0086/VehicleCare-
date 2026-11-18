import React, { useEffect, useState } from 'react';
import { authApi } from '../../api/auth.api';
import AdminBookings from '../admin/AdminBookings';

export default function GarageBookings() {
  const [garage, setGarage] = useState(null);
  const [error, setError] = useState('');

  async function loadGarage() {
    setError('');
    try {
      const data = await authApi.getGarage();
      setGarage(data.garage);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load your workshop.');
    }
  }

  useEffect(() => { loadGarage(); }, []);

  if (garage?.is_active) return <AdminBookings garageName={garage.name} />;

  return (
    <section className="mx-auto max-w-6xl space-y-3 p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">{garage?.name || 'Garage bookings'}</h1>
      {error ? <p role="alert" className="text-sm text-red-800">{error}</p> : garage ? (
        <p className="text-sm text-slate-600">Your workshop needs platform approval before customers can book it and you can manage bookings.</p>
      ) : <p role="status" className="text-sm text-slate-600">Loading your workshop…</p>}
      {(error || garage) && <button type="button" onClick={loadGarage} className="button button-primary">Check approval status</button>}
    </section>
  );
}
