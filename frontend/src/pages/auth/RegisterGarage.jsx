import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegistrationOptions from './RegistrationOptions';
import AuthLayout from './AuthLayout';
import PasswordField from './PasswordField';
import { passwordHint, phoneHint, registrationError } from './registrationValidation';
import { authApi } from '../../api/auth.api';

const fields = [
  { name: 'name', label: 'Your name', autoComplete: 'name', maxLength: 100 },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'section-garage username', maxLength: 150 },
  { name: 'phone', label: 'Workshop phone', type: 'tel', autoComplete: 'section-garage tel', maxLength: 32 },
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
    const invalid = registrationError(details);
    if (invalid) {
      setError(invalid);
      return;
    }
    delete details.confirmPassword;
    setSaving(true);
    setError('');
    try {
      const result = await authApi.registerGarage(details);
      navigate('/verify-email?account=garage', {
        replace: true,
        state: { email: details.email.trim(), emailSent: result.verificationEmailSent },
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not register the garage. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthLayout title="Register a garage" description="Submit your workshop for approval before customers can book it." wide>
      <RegistrationOptions />

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <form onSubmit={submit} onChange={() => setError('')} aria-busy={saving} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ label, ...field }) => (
            <label key={field.name} className="grid gap-1.5 text-sm font-semibold text-slate-700">
              {label}
              <input required className="auth-input" {...field} aria-describedby={field.name === 'phone' ? 'garage-phone-requirements' : undefined} />
              {field.name === 'phone' && <span id="garage-phone-requirements" className="font-normal text-slate-600">{phoneHint}</span>}
            </label>
          ))}
        </div>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Services offered (optional)
          <textarea name="services" rows="3" maxLength={1000} className="auth-input" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField id="garage-password" name="password" autoComplete="section-garage new-password" required minLength={8} maxLength={72} aria-describedby="garage-password-requirements" />
          <PasswordField id="garage-confirm" name="confirmPassword" label="Confirm password" autoComplete="section-garage new-password" required />
        </div>
        <p id="garage-password-requirements" className="text-sm text-slate-600">{passwordHint}</p>
        <button type="submit" disabled={saving} className="auth-submit">
          {saving ? 'Submitting…' : 'Submit for approval'}
        </button>
      </form>
      <Link to="/login?account=garage" className="inline-block text-sm font-semibold text-blue-700 hover:underline">Already registered? Sign in</Link>
    </AuthLayout>
  );
}
