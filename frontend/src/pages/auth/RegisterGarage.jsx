import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600';

const fields = [
  { name: 'name', label: 'Your name', autoComplete: 'name', maxLength: 100 },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email', maxLength: 150 },
  { name: 'phone', label: 'Workshop phone', type: 'tel', autoComplete: 'tel', maxLength: 20 },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', minLength: 6, maxLength: 72 },
  { name: 'garageName', label: 'Workshop name', autoComplete: 'organization', maxLength: 150 },
  { name: 'city', label: 'City', autoComplete: 'address-level2', maxLength: 100 },
  { name: 'address', label: 'Street address', autoComplete: 'street-address', maxLength: 1000 },
  { name: 'slotCapacity', label: 'Vehicles per time slot', type: 'number', min: 1, max: 100, defaultValue: 2 },
];

export default function RegisterGarage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    const details = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError('');
    try {
      const result = await authApi.registerGarage(details);
      navigate('/login?account=garage', { replace: true, state: { message: result.message } });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not register the garage. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Register a garage</h1>
          <p className="mt-2 text-sm text-slate-600">Create your garage account and submit your workshop for approval.</p>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ label, ...field }) => (
              <label key={field.name} className="grid gap-1.5 text-sm font-semibold text-slate-700">
                {label}
                <input required className={inputClass} {...field} />
              </label>
            ))}
          </div>
          <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
            Services offered (optional)
            <textarea name="services" rows="3" maxLength={1000} className={inputClass} />
          </label>
          <button type="submit" disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Submitting…' : 'Submit for approval'}
          </button>
        </form>
        <Link to="/login?account=garage" className="inline-block text-sm font-semibold text-blue-700 hover:underline">Already registered? Sign in</Link>
      </section>
    </div>
  );
}
