import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { homeFor } from '../../components/Navbar';
import AuthLayout from './AuthLayout';
import PasswordField from './PasswordField';
import { useAuth } from '../../context/AuthContext';

const accountOptions = [
  { label: 'Customer', role: 'CUSTOMER', to: '/login' },
  { label: 'Garage', role: 'GARAGE', to: '/login?account=garage' },
];

function initialCredentials(accountType) {
  if (import.meta.env.DEV && ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) {
    if (accountType === 'CUSTOMER') {
      return {
        email: import.meta.env.VITE_DEMO_CUSTOMER_EMAIL || '',
        password: import.meta.env.VITE_DEMO_CUSTOMER_PASSWORD || '',
      };
    }
    if (accountType === 'GARAGE') {
      return {
        email: import.meta.env.VITE_DEMO_GARAGE_EMAIL || '',
        password: import.meta.env.VITE_DEMO_GARAGE_PASSWORD || '',
      };
    }
  }
  return { email: '', password: '' };
}

export function Login({ platformAdmin = false }) {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const accountType = platformAdmin ? 'ADMIN' : queryParams.get('account') === 'garage' ? 'GARAGE' : 'CUSTOMER';

  return (
    <LoginForm
      key={accountType}
      accountType={accountType}
      isExpired={queryParams.get('expired') === '1'}
      notice={location.state?.message}
    />
  );
}

function LoginForm({ accountType, isExpired, notice }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => initialCredentials(accountType));
  const [needsVerification, setNeedsVerification] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
    setNeedsVerification(false);
  };

  const platformAdmin = accountType === 'ADMIN';
  const isGarage = accountType === 'GARAGE';
  const accountSection = platformAdmin ? 'section-admin' : isGarage ? 'section-garage' : 'section-customer';
  const title = platformAdmin ? 'Platform admin sign-in' : isGarage ? 'Garage sign-in' : 'Customer sign-in';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password, accountType);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || (err.response ? 'Unable to sign in. Please try again.' : 'Cannot reach the server. Check that the backend is running on port 5000.');
      setError(msg);
      setNeedsVerification(err.response?.data?.code === 'EMAIL_UNVERIFIED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={title}>
      {isExpired && (
        <div className="p-3 text-sm text-amber-800 bg-amber-50 rounded-lg border border-amber-200">
          Your session has expired. Please sign in again.
        </div>
      )}

      {notice && <div role="status" className="p-3 text-sm text-green-800 bg-green-50 rounded-lg border border-green-200">{notice}</div>}

      {error && (
        <div role="alert" className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
          {error}
          {needsVerification && (
            <Link
              to={isGarage ? '/verify-email?account=garage' : '/verify-email'}
              state={{ email: formData.email }}
              className="mt-2 block font-semibold underline"
            >
              Request a verification link
            </Link>
          )}
        </div>
      )}

      {!platformAdmin && (
        <nav aria-label="Sign in as" className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {accountOptions.map(({ label, role, to }) => {
            const selected = accountType === role;
            const className = `flex min-h-11 items-center justify-center rounded-lg px-2 text-sm font-semibold ${
              selected ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-700 hover:bg-slate-200'
            }`;
            return loading ? (
              <span key={role} className={className}>{label}</span>
            ) : (
              <Link
                key={role}
                to={to}
                aria-current={selected ? 'page' : undefined}
                className={className}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      )}

      <form key={accountSection} className="space-y-4" onSubmit={handleSubmit} aria-busy={loading}>
        <div>
          <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1">
            Email Address
          </label>
          <input
            id="login-email"
            autoComplete={`${accountSection} username`}
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="auth-input"
          />
        </div>

        <div>
          <PasswordField
            id="login-password"
            name="password"
            autoComplete={`${accountSection} current-password`}
            required
            value={formData.password}
            onChange={handleChange}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-500">Forgot password?</Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="auth-submit"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {!platformAdmin && (
        <p className="text-center text-sm">
          <Link to={isGarage ? '/register-garage' : '/register'} className="font-semibold text-blue-600 hover:underline">
            {isGarage ? 'Register a garage' : 'Create a customer account'}
          </Link>
        </p>
      )}
    </AuthLayout>
  );
}

export default Login;
