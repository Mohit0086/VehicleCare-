import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { homeFor } from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
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
      const user = await login(formData.email, formData.password, accountType);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || (err.response ? 'Unable to sign in. Please try again.' : 'Cannot reach the server. Check that the backend is running on port 5000.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 auth-layout">
      <aside className="auth-photo"><img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80" alt="Grey car on an open road" width="900" height="1200" /><p>Every mile<br />has a story.<br />Keep yours.</p></aside>
      <div className="auth-card max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900">
            Welcome back.
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Your vehicles, service records and the road ahead.
          </p>
        </div>

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

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-slate-700">Sign in as</legend>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              {[
                ['CUSTOMER', 'Customer'],
                ['GARAGE', 'Garage'],
                ['ADMIN', 'Platform admin'],
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
                  <span className="flex min-h-10 items-center justify-center rounded-lg px-1 text-center text-xs font-semibold text-slate-700 peer-checked:bg-white peer-checked:text-blue-700 peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-blue-600">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
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
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              id="login-password"
              autoComplete="current-password"
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <div className="mt-2 text-right">
              <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-500">Forgot password?</Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
          <Link to="/register" className="font-semibold text-blue-600 hover:underline">Create customer account</Link>
          <Link to="/register-garage" className="font-semibold text-blue-600 hover:underline">Register a garage</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;



