import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CarFront, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: 'CUSTOMER',
      });
      navigate('/customer/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || (err.response ? 'Registration failed. Please try again.' : 'Cannot reach the server. Check that the backend is running on port 5000.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 auth-layout">
      <aside className="auth-photo"><img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80" alt="Grey car on an open road" width="900" height="1200" /><p>A garage<br />of your own.</p></aside>
      <div className="auth-card max-w-md w-full space-y-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <CarFront size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Create your account.
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Sign up to track vehicle maintenance, receive prompt reminders, and schedule services.
          </p>
        </div>

        {error && (
          <div role="alert" className="p-3 text-xs font-semibold text-red-800 bg-red-50 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="register-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="register-name"
              autoComplete="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Mohit Sharma"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
          </div>

          <div>
            <label htmlFor="register-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="register-email"
              autoComplete="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="register-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone number *
            </label>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              pattern="[+0-9 ()-]{7,25}" title="Enter a valid phone number"
              placeholder="9876543210"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                minLength={6} maxLength={72}
                placeholder="At least 6 characters"
                className="w-full pl-3.5 pr-12 py-2.5 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                aria-controls="register-password"
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded text-slate-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="register-confirm" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Confirm password *
            </label>
            <div className="relative">
              <input
                id="register-confirm"
                name="confirmPassword"
                type={showConfirmation ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={6} maxLength={72}
                placeholder="Re-enter your password"
                className="w-full pl-3.5 pr-12 py-2.5 bg-white border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((visible) => !visible)}
                aria-label={showConfirmation ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmation}
                aria-controls="register-confirm"
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded text-slate-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {showConfirmation ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating Account…' : 'Complete Registration'} <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}
