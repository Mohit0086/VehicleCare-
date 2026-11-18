import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { homeFor } from '../../components/Navbar';
import AuthLayout from './AuthLayout';
import PasswordField from './PasswordField';
import { useAuth } from '../../context/AuthContext';

export const Login = ({ platformAdmin = false }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if redirected due to expired session
  const queryParams = new URLSearchParams(location.search);
  const isExpired = queryParams.get('expired') === '1';
  const notice = location.state?.message;

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const [accountType, setAccountType] = useState(queryParams.get('account') === 'garage' ? 'GARAGE' : 'CUSTOMER');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password, platformAdmin ? 'ADMIN' : accountType);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || (err.response ? 'Unable to sign in. Please try again.' : 'Cannot reach the server. Check that the backend is running on port 5000.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={platformAdmin ? 'Platform admin sign-in' : 'Sign in'}>
      {isExpired && (
        <div className="p-3 text-sm text-amber-800 bg-amber-50 rounded-lg border border-amber-200">
          Your session has expired. Please sign in again.
        </div>
      )}

      {notice && <div role="status" className="p-3 text-sm text-green-800 bg-green-50 rounded-lg border border-green-200">{notice}</div>}

      {error && (
        <div role="alert" className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} aria-busy={loading}>
        {!platformAdmin && <fieldset disabled={loading}>
          <legend className="mb-2 text-sm font-semibold text-slate-700">Sign in as</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            {[
              ['CUSTOMER', 'User'],
              ['GARAGE', 'Garage'],
            ].map(([value, label]) => (
              <label key={value} className="min-w-0 cursor-pointer">
                <input
                  type="radio"
                  className="peer sr-only"
                  name="accountType"
                  value={value}
                  checked={accountType === value}
                  onChange={() => { setAccountType(value); setError(''); }}
                />
                <span className="flex min-h-10 items-center justify-center rounded-lg px-1 text-center text-sm font-semibold text-slate-700 peer-checked:bg-white peer-checked:text-blue-700 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>}
        <div>
          <label htmlFor="login-email" className="block text-sm font-semibold text-slate-700 mb-1">
            Email Address
          </label>
          <input
            id="login-email"
            autoComplete="email"
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
            autoComplete="current-password"
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
          <Link to={accountType === 'GARAGE' ? '/register-garage' : '/register'} className="font-semibold text-blue-600 hover:underline">
            {accountType === 'GARAGE' ? 'Register a garage' : 'Create a user account'}
          </Link>
        </p>
      )}
    </AuthLayout>
  );
};

export default Login;
