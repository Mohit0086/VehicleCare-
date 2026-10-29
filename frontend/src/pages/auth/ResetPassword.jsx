import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CircleAlert, KeyRound } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { LoadingButton } from '../../components/WorkspaceUI';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) return setError('This reset link is missing its token. Request a new link to continue.');
    if (password.length < 8) return setError('Choose a password with at least 8 characters.');
    if (password !== confirmation) return setError('The passwords do not match.');
    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      navigate('/login', { replace: true, state: { message: 'Your password has been reset. Sign in with your new password.' } });
    } catch (err) {
      setError(err.response?.data?.error || (err.response?.status === 404
        ? 'Password recovery is not available yet. The backend reset endpoint still needs to be implemented.'
        : 'This reset link may have expired. Request a new one and try again.'));
    } finally {
      setBusy(false);
    }
  };

  return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-slate-50">
    <section className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <Link to="/login" className="back-link"><ArrowLeft size={15}/>Back to sign in</Link>
      <div><p className="eyebrow">ACCOUNT RECOVERY</p><h1 className="text-2xl font-bold text-slate-900">Set a new password</h1><p className="mt-2 text-sm text-slate-600">Choose a new password for your VehicleCare account.</p></div>
      {!token && <div role="alert" className="form-alert"><CircleAlert size={16}/>This reset link is missing its token. Request a new link to continue.</div>}
      {error && <div role="alert" className="form-alert"><CircleAlert size={16}/>{error}</div>}
      <form className="space-y-4" onSubmit={submit}>
        <label className="block text-sm font-semibold text-slate-700">New password<input className="mt-1 w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
        <label className="block text-sm font-semibold text-slate-700">Confirm new password<input className="mt-1 w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>
        <LoadingButton loading={busy} disabled={!token}><KeyRound size={16}/>Reset password</LoadingButton>
      </form>
      <p className="text-xs text-slate-500">For your security, reset links should expire and can be used only once.</p>
    </section>
  </div>;
}
