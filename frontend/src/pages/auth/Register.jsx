import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RegistrationOptions from './RegistrationOptions';
import { authApi } from '../../api/auth.api';
import AuthLayout from './AuthLayout';
import PasswordField from './PasswordField';
import { passwordHint, phoneHint, registrationError } from './registrationValidation';

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const invalid = registrationError(formData);
    if (invalid) {
      setError(invalid);
      return;
    }

    setLoading(true);

    try {
      const result = await authApi.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
      });
      navigate('/verify-email', {
        replace: true,
        state: { email: formData.email.trim(), emailSent: result.verificationEmailSent },
      });
    } catch (err) {
      const msg = err.response?.data?.error || (err.response ? 'Registration failed. Please try again.' : 'Cannot reach the server. Check that the backend is running on port 5000.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create a customer account" description="Track your vehicles, book services, and view invoices.">
      <RegistrationOptions />

      {error && (
        <div role="alert" className="p-3 text-xs font-semibold text-red-800 bg-red-50 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} aria-busy={loading}>
        <div>
          <label htmlFor="register-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Full name
          </label>
          <input
            type="text"
            id="register-name"
            autoComplete="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            maxLength={100}
            className="auth-input"
          />
        </div>

        <div>
          <label htmlFor="register-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Email address
          </label>
          <input
            type="email"
            id="register-email"
            autoComplete="section-customer username"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            maxLength={150}
            className="auth-input"
          />
        </div>

        <div>
          <label htmlFor="register-phone" className="mb-1.5 block text-sm font-semibold text-slate-700">
            Phone number
          </label>
          <input
            id="register-phone"
            name="phone"
            type="tel"
            autoComplete="section-customer tel"
            required
            value={formData.phone}
            onChange={handleChange}
            maxLength={32}
            aria-describedby="customer-phone-requirements"
            className="auth-input"
          />
          <p id="customer-phone-requirements" className="mt-1.5 text-sm text-slate-600">{phoneHint}</p>
        </div>

        <PasswordField
          id="register-password"
          name="password"
          autoComplete="section-customer new-password"
          required
          minLength={8}
          maxLength={72}
          aria-describedby="password-requirements"
          value={formData.password}
          onChange={handleChange}
        />
        <p id="password-requirements" className="text-sm text-slate-600">{passwordHint}</p>
        <PasswordField
          id="register-confirm"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="section-customer new-password"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        <button type="submit" disabled={loading} className="auth-submit">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
        Already registered?{' '}
        <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
