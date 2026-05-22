import React, { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getFirebaseErrorMessage } from '../../contexts/AuthContext';
import { Mail, AlertCircle, CheckCircle2, RefreshCw, LogOut } from 'lucide-react';

const RESEND_COOLDOWN = 60; // seconds
const CODE_LENGTH = 6;

const VerifyEmailPage: React.FC = () => {
  const { currentUser, verifyOtp, resendOtp, logout } = useAuth();
  const navigate = useNavigate();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ── OTP input handlers ──────────────────────────────────────────────────

  const handleChange = (index: number, val: string) => {
    // Accept only digits
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    const filled = next.every((d) => d !== '');
    if (filled) {
      submitCode(next.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    // Focus last filled or last box
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === CODE_LENGTH) {
      submitCode(pasted);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const submitCode = async (code: string) => {
    setError('');
    setVerifying(true);
    try {
      await verifyOtp(code);
      setVerified(true);
      // Brief success flash, then navigate
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
      // Clear inputs so user can try again
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    } finally {
      setVerifying(false);
    }
  };

  // ── Resend ──────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (cooldown > 0 || resendStatus === 'sending') return;
    setResendStatus('sending');
    setResendError('');
    setError('');
    try {
      await resendOtp();
      setResendStatus('sent');
      setCooldown(RESEND_COOLDOWN);
      const interval = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(interval); return 0; }
          return c - 1;
        });
      }, 1000);
      // Reset OTP inputs
      setDigits(Array(CODE_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 0);
    } catch (err: any) {
      setResendError(getFirebaseErrorMessage(err.code));
      setResendStatus('error');
    }
  };

  // ── Logout ──────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Email verified!</h2>
          <p className="text-gray-500 text-sm">Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6 text-center">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
            <Mail size={32} className="text-primary-500" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="text-gray-600 text-sm">
            We sent a 6-digit verification code to{' '}
            <span className="font-medium text-gray-800">{currentUser?.email}</span>.
            <br />
            Enter it below — it expires in 10 minutes.
          </p>
        </div>

        {/* OTP Input */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={verifying}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={i === 0 ? handlePaste : undefined}
              className={`
                w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-semibold
                border-2 rounded-lg outline-none transition-all
                ${digit ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-white'}
                ${error ? 'border-red-400 bg-red-50' : ''}
                focus:border-primary-500 focus:ring-2 focus:ring-primary-200
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        {/* Verifying spinner */}
        {verifying && (
          <div className="flex justify-center">
            <Spinner />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Resend success */}
        {resendStatus === 'sent' && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            New code sent. Check your inbox (and spam folder).
          </div>
        )}

        {/* Resend error */}
        {resendStatus === 'error' && resendError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            {resendError}
          </div>
        )}

        {/* Resend button */}
        <button
          onClick={handleResend}
          disabled={resendStatus === 'sending' || cooldown > 0}
          className="btn-secondary w-full flex justify-center items-center gap-2"
        >
          {resendStatus === 'sending' ? (
            <Spinner dark />
          ) : (
            <>
              <RefreshCw size={15} />
              {cooldown > 0
                ? `Resend code in ${cooldown}s`
                : resendStatus === 'sent'
                ? 'Send a new code'
                : 'Resend code'}
            </>
          )}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <LogOut size={14} />
          Use a different account
        </button>

        <p className="text-xs text-gray-400">
          Can't find the email? Check your spam/junk folder.
        </p>
      </div>
    </div>
  );
};

const Spinner = ({ dark = false }: { dark?: boolean }) => (
  <svg
    className={`animate-spin h-5 w-5 ${dark ? 'text-gray-600' : 'text-primary-500'}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

export default VerifyEmailPage;