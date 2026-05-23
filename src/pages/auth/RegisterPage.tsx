import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAuth,
  getFirebaseErrorMessage,
  validateEmail,
  validatePassword,
  validateName,
} from '../../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, MailCheck } from 'lucide-react';
import PasswordStrengthMeter from '../../components/auth/PasswordStrengthMeter';

const RegisterPage: React.FC = () => {
  const [name, setName]                               = useState('');
  const [email, setEmail]                             = useState('');
  const [password, setPassword]                       = useState('');
  const [confirmPassword, setConfirmPassword]         = useState('');
  const [showPassword, setShowPassword]               = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmTouched, setConfirmTouched]           = useState(false);
  const [error, setError]                             = useState('');
  const [loading, setLoading]                         = useState(false);
  const [successEmail, setSuccessEmail]               = useState('');

  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConfirmTouched(true);

    // Name — permissive, allows @ # % & ^ _ . and most special chars
    const nameCheck = validateName(name);
    if (!nameCheck.isValid) {
      setError(nameCheck.message);
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const pwCheck = validatePassword(password);
    if (!pwCheck.isValid) {
      setError(pwCheck.message);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(email.trim(), password, name.trim());
      // register() handles the duplicate-email probe internally and throws
      // auth/email-already-in-use if the account exists — no verification
      // email is sent in that case.
      setSuccessEmail(email.trim());
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const showMismatch = confirmTouched && confirmPassword !== '' && confirmPassword !== password;

  // ── Success screen ────────────────────────────────────────────────────────
  if (successEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="flex justify-center">
            <div className="bg-green-100 rounded-full p-4">
              <MailCheck size={40} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check your inbox</h2>
          <p className="text-gray-600">
            We sent a verification link to{' '}
            <span className="font-medium text-gray-900">{successEmail}</span>.
            Click the link to activate your account, then sign in.
          </p>
          <p className="text-sm text-gray-500">Don't see it? Check your spam folder.</p>
          <Link to="/login" className="btn-primary inline-block px-8 py-2 rounded-lg">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">

        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              sign in to your existing account
            </Link>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">

            {/* Username — letters, digits, underscore and dot only */}
            <div>
              <label htmlFor="name" className="label">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User size={18} />
                </div>
                <input
                  id="name"
                  type="text"
                  autoComplete="username"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-10"
                  placeholder="john_doe"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password + eye toggle + strength meter */}
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Confirm Password + eye toggle */}
            <div>
              <label htmlFor="confirm-password" className="label">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  className={`input pl-10 pr-10 ${showMismatch ? 'border-red-300' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {showMismatch && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
              )}
            </div>

          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center">
            {loading ? <Spinner /> : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          By signing up, you agree to our{' '}
          <a href="#" className="text-primary-600 hover:text-primary-500">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-primary-600 hover:text-primary-500">Privacy Policy</a>
        </p>

      </div>
    </div>
  );
};

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

export default RegisterPage;
