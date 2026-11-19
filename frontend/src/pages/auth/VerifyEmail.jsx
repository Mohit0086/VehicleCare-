import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import AuthLayout from './AuthLayout';
import PasswordField from './PasswordField';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const token = query.get('token');
  const garage = query.get('account') === 'garage';
  const loginPath = garage ? '/login?account=garage' : '/login';
  const resendPath = garage ? '/verify-email?account=garage' : '/verify-email';
  const [email, setEmail] = useState(location.state?.email || '');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (token) {
        const { password } = Object.fromEntries(new FormData(event.currentTarget));
        const result = await authApi.verifyEmail({ token, password });
        const isGarage = result.role === 'GARAGE';
        navigate(isGarage ? '/login?account=garage' : '/login', {
          replace: true,
          state: {
            message: isGarage
              ? 'Email verified. Sign in to check your workshop approval status.'
              : 'Email verified. You can now sign in.',
          },
        });
      } else {
        const result = await authApi.resendVerification(email.trim());
        setNotice(result.message);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not complete the request. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const emailSent = location.state?.emailSent;
  return (
    <AuthLayout
      title={emailSent === true && !token ? 'Check your email' : 'Verify your email'}
      description={token
        ? 'Enter the password you chose when you registered to confirm this email address.'
        : emailSent === true
          ? 'Open the verification link in your inbox. It expires in 24 hours.'
          : 'Enter your account email to request a verification link.'}
    >
      {emailSent === false && !token && !notice && !error && (
        <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          We created your account but couldn’t send the email. Request another link below.
        </p>
      )}
      {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <form className="space-y-4" onSubmit={submit} aria-busy={busy}>
        {token ? (
          <PasswordField id="verification-password" name="password" autoComplete="current-password" required maxLength={72} />
        ) : (
          <label className="block space-y-1.5 text-sm font-semibold text-slate-700">
            Email address
            <input
              className="auth-input"
              type="email"
              name="email"
              autoComplete="email"
              required
              maxLength={150}
              value={email}
              onChange={(event) => { setEmail(event.target.value); setError(''); }}
            />
          </label>
        )}
        <button type="submit" className="auth-submit" disabled={busy}>
          {token ? (busy ? 'Verifying…' : 'Verify email') : (busy ? 'Sending…' : 'Send verification link')}
        </button>
      </form>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-primary">
        <Link className="hover:underline" to={loginPath}>Back to sign in</Link>
        {token && <Link className="hover:underline" to={resendPath}>Request a new link</Link>}
      </div>
    </AuthLayout>
  );
}
