/**
 * AuthContext.tsx
 *
 * Requires "Email Enumeration Protection" to be DISABLED in Firebase Console:
 *   Authentication → Settings → User Actions → uncheck "Email enumeration protection"
 *
 * With that off, Firebase returns:
 *   auth/user-not-found   → no account with that email
 *   auth/wrong-password   → account exists but password is wrong
 *   auth/email-already-in-use → tried to register with existing email
 *
 * Registration guard:
 *   Before calling createUserWithEmailAndPassword we attempt a dummy sign-in
 *   to probe whether the email exists. If Firebase returns auth/wrong-password
 *   the account already exists → we throw auth/email-already-in-use immediately
 *   without creating anything or sending a verification email.
 *   If Firebase returns auth/user-not-found → safe to register normally.
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
  sendEmailVerification,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  ActionCodeSettings,
  User,
  reload,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  register: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string }) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

// ─── Verification email settings ──────────────────────────────────────────────
// After clicking the link, Firebase redirects the user to this URL.
// Customize the email subject/body in:
//   Firebase Console → Authentication → Templates → Email address verification
const verificationActionSettings: ActionCodeSettings = {
  url: `${window.location.origin}/login?verified=true`,
  handleCodeInApp: false,
};

// ─── Error message map ────────────────────────────────────────────────────────

export function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/invalid-credential':
      // Fallback if enumeration protection is still on — shouldn't appear
      // once the Firebase Console setting is disabled.
      return 'Incorrect email or password. Please try again.';
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
    case 'auth/email-not-verified':
      return 'Please verify your email before signing in.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

// ─── Validators ───────────────────────────────────────────────────────────────

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Username validation — strict allowlist.
 * Only permits: letters (A-Z, a-z), digits (0-9), underscore (_), dot (.)
 * Everything else — spaces, @, #, $, !, etc. — is rejected.
 */
export function validateName(name: string): { isValid: boolean; message: string } {
  if (!name.trim()) {
    return { isValid: false, message: 'Please enter your username.' };
  }
  if (name.trim().length < 2) {
    return { isValid: false, message: 'Username must be at least 2 characters.' };
  }
  if (name.length > 60) {
    return { isValid: false, message: 'Username must be under 60 characters.' };
  }
  // Allowlist: letters, digits, underscore, dot only
  const allowed = /^[A-Za-z0-9_.]+$/;
  if (!allowed.test(name)) {
    return {
      isValid: false,
      message: 'Username may only contain letters, numbers, underscores (_), and dots (.).',
    };
  }
  return { isValid: true, message: '' };
}

export function validatePassword(password: string): {
  isValid: boolean;
  message: string;
  strength: 'weak' | 'moderate' | 'strong';
} {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters.', strength: 'weak' };
  }
  const hasUpper   = /[A-Z]/.test(password);
  const hasNumber  = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  if (password.length >= 10 && score >= 2) return { isValid: true, message: '', strength: 'strong' };
  if (password.length >= 8  || score >= 1) return { isValid: true, message: '', strength: 'moderate' };
  return { isValid: true, message: '', strength: 'weak' };
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
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── register ──────────────────────────────────────────────────────────────
  /**
   * Step 1 — Probe whether the email is already registered.
   *   We attempt a sign-in with a deliberately wrong password ('__probe__').
   *   With Email Enumeration Protection OFF:
   *     auth/wrong-password  → account exists  → throw email-already-in-use
   *     auth/user-not-found  → no account      → safe to register
   *   Any other error (network, invalid-email) bubbles up normally.
   *
   * Step 2 — Create account, send verification email, sign out.
   */
  async function register(email: string, password: string, name: string): Promise<void> {
    // Probe for existing account
    try {
      await signInWithEmailAndPassword(auth, email, '__probe__');
      // If sign-in somehow succeeds (astronomically unlikely), sign back out
      await signOut(auth);
    } catch (probeErr: any) {
      if (probeErr.code === 'auth/wrong-password') {
        // Account exists — do NOT create a new one or send any email
        const err: any = new Error('Account already exists.');
        err.code = 'auth/email-already-in-use';
        throw err;
      }
      if (probeErr.code !== 'auth/user-not-found') {
        // Unexpected error (network, invalid-email, etc.) — surface it
        throw probeErr;
      }
      // auth/user-not-found → no account → proceed to registration below
    }

    // Create the account
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    await updateProfile(user, { displayName: name });

    // Send Firebase's native verification link
    await sendEmailVerification(user, verificationActionSettings);

    // Persist profile to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email: user.email,
      createdAt: serverTimestamp(),
    });

    // Sign out — app access is gated on emailVerified === true
    await signOut(auth);
  }

  // ── login ─────────────────────────────────────────────────────────────────
  /**
   * With Email Enumeration Protection OFF, Firebase returns distinct codes:
   *   auth/user-not-found  → email not registered
   *   auth/wrong-password  → email registered, password wrong
   * Both propagate to getFirebaseErrorMessage which maps them correctly.
   */
  async function login(email: string, password: string): Promise<void> {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    if (!credential.user.emailVerified) {
      await signOut(auth);
      const err: any = new Error('Email not verified.');
      err.code = 'auth/email-not-verified';
      throw err;
    }
  }

  // ── resendVerificationEmail ───────────────────────────────────────────────
  async function resendVerificationEmail(): Promise<void> {
    if (!currentUser) {
      const err: any = new Error('Not signed in.');
      err.code = 'auth/user-not-found';
      throw err;
    }
    await sendEmailVerification(currentUser, verificationActionSettings);
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
      setCurrentUser(
        Object.assign(Object.create(Object.getPrototypeOf(currentUser)), currentUser)
      );
    }
  }

  // ── updateUserProfile ─────────────────────────────────────────────────────
  async function updateUserProfile(data: { displayName?: string }): Promise<void> {
    if (!currentUser) throw Object.assign(new Error('Not signed in.'), { code: 'auth/user-not-found' });
    if (data.displayName !== undefined) {
      await updateProfile(currentUser, { displayName: data.displayName });
      // Mirror the change to Firestore so it stays in sync
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { name: data.displayName },
        { merge: true }
      );
    }
    // Refresh local user object so UI reflects the change immediately
    await reload(currentUser);
    setCurrentUser(
      Object.assign(Object.create(Object.getPrototypeOf(currentUser)), currentUser)
    );
  }

  // ── updateUserPassword ────────────────────────────────────────────────────
  /**
   * Re-authenticates with the supplied current password, then sets the new one.
   * Firebase requires a recent sign-in for sensitive operations; this satisfies
   * that requirement without forcing a full logout.
   */
  async function updateUserPassword(currentPasswordValue: string, newPasswordValue: string): Promise<void> {
    if (!currentUser || !currentUser.email) {
      throw Object.assign(new Error('Not signed in.'), { code: 'auth/user-not-found' });
    }
    const credential = EmailAuthProvider.credential(currentUser.email, currentPasswordValue);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPasswordValue);
  }

  const value: AuthContextType = {
    currentUser,
    loading,
    register,
    login,
    logout,
    forgotPassword,
    resendVerificationEmail,
    refreshUser,
    updateUserProfile,
    updateUserPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;