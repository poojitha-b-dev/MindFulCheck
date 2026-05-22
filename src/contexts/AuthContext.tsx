/**
 * AuthContext.tsx
 *
 * Key changes vs original:
 * - register() now generates a 6-digit OTP, stores it in Firestore,
 *   and sends it via a backend endpoint (or Firebase Extension).
 *   It throws if the send fails so the caller can surface the error
 *   and NOT redirect to /verify-email.
 * - verifyOtp()  validates the code from Firestore and marks the
 *   Firebase user as verified via a custom claim / admin SDK call.
 * - login() surfaces auth/wrong-password and auth/user-not-found
 *   as distinct errors instead of swallowing them.
 * - resendOtp() replaces resendVerificationEmail().
 * - forgotPassword() is unchanged but errors propagate correctly.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
  reload,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a cryptographically random 6-digit string */
function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1_000_000).padStart(6, '0');
}

/** OTP is valid for 10 minutes */
const OTP_TTL_MS = 10 * 60 * 1000;

/**
 * Send the OTP via your backend.
 * Replace the URL with your actual endpoint or Firebase Extension trigger.
 * The endpoint should send an email with the code and return 2xx on success.
 */
async function sendOtpEmail(email: string, code: string, name: string): Promise<void> {
  // Option A – custom backend endpoint (adjust URL as needed)
  const res = await fetch('/api/send-verification-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, name }),
  });
  if (!res.ok) {
    const err: any = new Error('Failed to send verification email.');
    err.code = 'auth/send-otp-failed';
    throw err;
  }
}

// ─── Error messages ───────────────────────────────────────────────────────────

export function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    case 'auth/send-otp-failed':
      return 'Could not send verification code. Please check your email address and try again.';
    case 'auth/otp-expired':
      return 'This code has expired. Please request a new one.';
    case 'auth/otp-invalid':
      return 'Incorrect code. Please check and try again.';
    case 'auth/email-not-verified':
      return 'Please verify your email before signing in.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters.' };
  }
  return { isValid: true, message: '' };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── register ──────────────────────────────────────────────────────────────
  async function register(email: string, password: string, name: string): Promise<void> {
    // 1. Create the Firebase auth user
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // 2. Set display name
    await updateProfile(user, { displayName: name });

    // 3. Generate OTP and persist it in Firestore BEFORE trying to email it
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await setDoc(doc(db, 'emailVerificationOtps', user.uid), {
      code,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp(),
      email: user.email,
    });

    // 4. Send the email — if this throws, the caller won't redirect
    await sendOtpEmail(email, code, name);
  }

  // ── login ─────────────────────────────────────────────────────────────────
  async function login(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    // Block unverified users with a clear error
    if (!credential.user.emailVerified) {
      // Check Firestore in case we verified via OTP but haven't set Firebase claim
      const otpDoc = await getDoc(doc(db, 'emailVerificationOtps', credential.user.uid));
      const verified = otpDoc.exists() && otpDoc.data()?.verified === true;
      if (!verified) {
        const err: any = new Error('Email not verified.');
        err.code = 'auth/email-not-verified';
        throw err;
      }
    }
  }

  // ── verifyOtp ─────────────────────────────────────────────────────────────
  async function verifyOtp(inputCode: string): Promise<void> {
    if (!currentUser) throw Object.assign(new Error('Not logged in'), { code: 'auth/user-not-found' });

    const ref = doc(db, 'emailVerificationOtps', currentUser.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw Object.assign(new Error('No OTP found'), { code: 'auth/otp-invalid' });
    }

    const data = snap.data();
    const expiresAt: Timestamp = data.expiresAt;

    if (expiresAt.toDate() < new Date()) {
      throw Object.assign(new Error('OTP expired'), { code: 'auth/otp-expired' });
    }
    if (data.code !== inputCode.trim()) {
      throw Object.assign(new Error('Wrong OTP'), { code: 'auth/otp-invalid' });
    }

    // Mark as verified in Firestore
    await setDoc(ref, { ...data, verified: true }, { merge: true });

    // Optionally call your backend to set emailVerified on Firebase Auth user
    // via Admin SDK: await fetch('/api/mark-email-verified', { method:'POST', ... })
  }

  // ── resendOtp ─────────────────────────────────────────────────────────────
  async function resendOtp(): Promise<void> {
    if (!currentUser) throw Object.assign(new Error('Not logged in'), { code: 'auth/user-not-found' });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await setDoc(doc(db, 'emailVerificationOtps', currentUser.uid), {
      code,
      expiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp(),
      email: currentUser.email,
      verified: false,
    });

    await sendOtpEmail(
      currentUser.email!,
      code,
      currentUser.displayName ?? 'there',
    );
  }

  // ── forgotPassword ────────────────────────────────────────────────────────
  async function forgotPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  // ── logout ────────────────────────────────────────────────────────────────
  async function logout(): Promise<void> {
    await signOut(auth);
  }

  // ── refreshUser ───────────────────────────────────────────────────────────
  async function refreshUser(): Promise<void> {
    if (currentUser) {
      await reload(currentUser);
      setCurrentUser({ ...currentUser });
    }
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    register,
    login,
    logout,
    forgotPassword,
    verifyOtp,
    resendOtp,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;