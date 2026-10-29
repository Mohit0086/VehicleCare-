import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CircleAlert, MailCheck } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { LoadingButton } from '../../components/WorkspaceUI';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await authApi.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || (err.response?.status === 404
        ? 'Password recovery is not available yet. The backend reset endpoint still needs to be implemented.'
        : 'We could not submit your request. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-slate-50">
    <section className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
      <Link to="/login" className="back-link"><ArrowLeft size={15}/>Back to sign in</Link>
      {sent ? <div className="text-center space-y-4" role="status">
        <span className="success-mark mx-auto"><MailCheck size={24}/></span>
        <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
        <p className="text-sm text-slate-600">If an account exists for <strong>{email}</strong>, a password reset link will be sent.</p>
        <p className="text-xs text-slate-500">The link should expire after a limited time. Check your spam folder if it doesn’t arrive.</p>
      </div> : <>
        <div><p className="eyebrow">ACCOUNT RECOVERY</p><h1 className="text-2xl font-bold text-slate-900">Forgot your password?</h1><p className="mt-2 text-sm text-slate-600">Enter your account email and we’ll send a time-limited reset link.</p></div>
        {error && <div role="alert" className="form-alert"><CircleAlert size={16}/>{error}</div>}
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-700">Email address<input className="mt-1 w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
          <LoadingButton loading={busy}>Send reset link</LoadingButton>
        </form>
      </>}
    </section>
  </div>;
}
