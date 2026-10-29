import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Login = () => {
  const { login, loginDemo } = useAuth();
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

  const redirectByRole = (role) => {
    if (role === 'ADMIN') navigate('/admin/dashboard');
    else if (role === 'MECHANIC') navigate('/mechanic/jobs');
    else navigate('/owner/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(formData.email, formData.password);
      redirectByRole(user.role);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to login. Please check credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Development preview sign-in
  const enterPreview = (role) => { loginDemo(role); redirectByRole(role); };


  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900">
            Sign In to VehicleCare
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Smart Vehicle Maintenance & Service Management System
          </p>
        </div>

        {isExpired && (
          <div className="p-3 text-sm text-amber-800 bg-amber-50 rounded-lg border border-amber-200">
            Your session has expired. Please sign in again.
          </div>
        )}

        {notice && <div role="status" className="p-3 text-sm text-green-800 bg-green-50 rounded-lg border border-green-200">{notice}</div>}

        {error && (
          <div className="p-3 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {/* Demo Fast-Switch Buttons for Guide/Examiner Presentation */}
        {import.meta.env.DEV && <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 text-center">
            Preview a signed-in workspace
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => enterPreview('OWNER')}
              className="px-2 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => enterPreview('MECHANIC')}
              className="px-2 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 rounded border border-amber-200 transition-colors"
            >
              Mechanic
            </button>
            <button
              type="button"
              onClick={() => enterPreview('ADMIN')}
              className="px-2 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 rounded border border-purple-200 transition-colors"
            >
              Admin
            </button>
          </div>
        </div>}

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
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

        <p className="text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;



