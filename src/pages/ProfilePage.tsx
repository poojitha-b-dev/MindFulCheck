import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Clock,
  Download,
  ChevronUp,
} from 'lucide-react';
import { useAuth, validateName, validatePassword, getFirebaseErrorMessage } from '../contexts/AuthContext';
import { collection, query, orderBy, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import Toast, { ToastState, showToast } from '../components/Toast';
import emailjs from '@emailjs/browser';

// ─── EmailJS config — fill these in after setting up emailjs.com ──────────────
VITE_EMAILJS_SERVICE_ID=service_kenhb9s
VITE_EMAILJS_TEMPLATE_ID=rj5lq8o
VITE_EMAILJS_PUBLIC_KEY=SZrPHR38h0jxewBcl

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssessmentRecord {
  id: string;
  date: string;
  type: string;
  score: number;
  severity: string;
  severityColor: string;
}

interface NotificationPrefs {
  emailNotifications: boolean;
  assessmentReminders: boolean;
  moodCheckIns: boolean;
  newResources: boolean;
  reminderTime: string; // "HH:MM" 24-hour format, e.g. "09:00"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityBadge(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'none':
    case 'minimal':  return 'bg-green-100 text-green-800';
    case 'mild':     return 'bg-secondary-100 text-secondary-800';
    case 'moderate': return 'bg-warning-100 text-warning-800';
    case 'severe':
    case 'moderately severe': return 'bg-red-100 text-red-800';
    default:         return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

// Returns today's date as "YYYY-MM-DD"
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const { currentUser, updateUserProfile, updateUserPassword } = useAuth();

  // ── Toast ──
  const [toast, setToast] = useState<ToastState | null>(null);

  // ── Profile section ──
  const [name, setName]                   = useState(currentUser?.displayName || '');
  const [email]                           = useState(currentUser?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Security section ──
  const [currentPassword, setCurrentPassword]         = useState('');
  const [newPassword, setNewPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]         = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving]           = useState(false);

  // ── Notification section ──
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    emailNotifications:  true,
    assessmentReminders: true,
    moodCheckIns:        true,
    newResources:        false,
    reminderTime:        '09:00',
  });
  const [notifSaving, setNotifSaving]   = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // ── Assessment history section ──
  const [assessments, setAssessments]               = useState<AssessmentRecord[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);

  // ── Shared UI ──
  const [expandedSection, setExpandedSection] = useState<string | null>('profile');

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  // ── Load notification prefs from Firestore ────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    setNotifLoading(true);
    getDoc(doc(db, 'users', currentUser.uid))
      .then(snap => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.notificationPrefs) {
            setNotifPrefs(prev => ({
              ...prev,
              ...d.notificationPrefs,
              reminderTime: d.notificationPrefs.reminderTime ?? '09:00',
            }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setNotifLoading(false));
  }, [currentUser]);

  // ── Check & send reminders when the app is opened ─────────────────────────
  // Logic: if emailNotifications is on, a specific sub-toggle is on,
  // the current hour matches reminderTime, and we haven't sent today → send.
  useEffect(() => {
    if (!currentUser || !notifPrefs.emailNotifications) return;
    if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') return; // not configured yet

    const checkAndSendReminders = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return;

      const data = snap.data();
      const lastSent: string = data.lastReminderSent ?? '';
      const today = todayStr();

      // Already sent today — skip
      if (lastSent === today) return;

      // Check if current hour matches the chosen reminder time
      const [targetHour, targetMinute] = (notifPrefs.reminderTime ?? '09:00').split(':').map(Number);
      const now = new Date();
      const currentHour   = now.getHours();
      const currentMinute = now.getMinutes();

      // Send if we're within the same hour as the target (e.g. any time between 09:00–09:59)
      if (currentHour !== targetHour) return;
      // Optional tighter check: only within first 30 min of the hour
      if (currentMinute > 30) return;

      // Build the messages to send
      const messages: { message: string }[] = [];

      if (notifPrefs.assessmentReminders) {
        messages.push({
          message: "It's time for your periodic mental wellness assessment! Regular check-ins help track your progress. Visit MindfulCheck to take your PHQ-9 or GAD-7 assessment today.",
        });
      }
      if (notifPrefs.moodCheckIns) {
        messages.push({
          message: "Don't forget to log your mood today! Tracking your daily mood, sleep, and energy helps you understand your mental wellness trends over time.",
        });
      }
      if (notifPrefs.newResources) {
        messages.push({
          message: "New mental health resources are available on MindfulCheck! Check out the latest articles, videos, and podcasts to support your wellness journey.",
        });
      }

      if (messages.length === 0) return;

      // Send one combined email
      const combinedMessage = messages.map((m, i) => `${i + 1}. ${m.message}`).join('\n\n');

      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          {
            to_email: currentUser.email,
            to_name:  currentUser.displayName || 'there',
            message:  combinedMessage,
          },
          EMAILJS_PUBLIC_KEY
        );

        // Mark today as sent so it doesn't fire again
        await setDoc(userRef, { lastReminderSent: today }, { merge: true });
      } catch (err) {
        console.error('EmailJS send failed:', err);
      }
    };

    checkAndSendReminders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, notifPrefs.emailNotifications, notifPrefs.reminderTime]);

  // ── Load assessment history from Firestore ────────────────────────────────
  useEffect(() => {
    if (expandedSection !== 'data' || !currentUser) return;
    setAssessmentsLoading(true);

    const assessmentsRef = collection(db, 'users', currentUser.uid, 'assessments');
    const q = query(assessmentsRef, orderBy('timestamp', 'desc'));

    getDocs(q)
      .then(snap => {
        const rows: AssessmentRecord[] = snap.docs.map(d => {
          const data = d.data();
          const rawDate = data.timestamp?.toDate?.() ?? new Date(data.timestamp ?? 0);
          const severity: string = data.severity ?? '—';
          return {
            id: d.id,
            date: rawDate.toISOString(),
            type: data.type ?? 'Assessment',
            score: data.score ?? 0,
            severity,
            severityColor: severityBadge(severity),
          };
        });
        setAssessments(rows);
      })
      .catch(() => setAssessments([]))
      .finally(() => setAssessmentsLoading(false));
  }, [expandedSection, currentUser]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateName(name);
    if (!check.isValid) { showToast(setToast, 'error', check.message); return; }

    try {
      setProfileSaving(true);
      await updateUserProfile({ displayName: name.trim() });
      showToast(setToast, 'success', 'Profile updated successfully.');
    } catch (err: any) {
      showToast(setToast, 'error', getFirebaseErrorMessage(err.code));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { showToast(setToast, 'error', 'Please enter your current password.'); return; }
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.isValid) { showToast(setToast, 'error', pwCheck.message); return; }
    if (newPassword !== confirmPassword) { showToast(setToast, 'error', 'New passwords do not match.'); return; }
    if (newPassword === currentPassword)  { showToast(setToast, 'error', 'New password must differ from current password.'); return; }

    try {
      setPasswordSaving(true);
      await updateUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(setToast, 'success', 'Password updated successfully.');
    } catch (err: any) {
      showToast(setToast, 'error', getFirebaseErrorMessage(err.code), 6000);
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!currentUser) return;
    try {
      setNotifSaving(true);
      await setDoc(doc(db, 'users', currentUser.uid), { notificationPrefs: notifPrefs }, { merge: true });
      showToast(setToast, 'success', 'Notification preferences saved.');
    } catch {
      showToast(setToast, 'error', 'Failed to save preferences. Please try again.');
    } finally {
      setNotifSaving(false);
    }
  };

  const handleExportData = () => {
    if (!assessments.length) {
      showToast(setToast, 'error', 'No assessment data to export.');
      return;
    }
    const header = 'Date,Assessment,Score,Severity\n';
    const rows = assessments
      .map(a => `${formatDate(a.date)},${a.type},${a.score},${a.severity}`)
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindfulcheck-assessments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(setToast, 'success', 'Assessment data exported.');
  };

  const toggleNotif = (key: keyof NotificationPrefs) => {
    if (key === 'reminderTime') return; // handled separately
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Sidebar ── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mr-4">
                  <User size={24} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{currentUser?.displayName || 'User'}</h3>
                  <p className="text-gray-500 text-sm">{currentUser?.email}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <nav className="space-y-1">
                {([
                  { key: 'profile',       label: 'Profile Information',  Icon: User   },
                  { key: 'security',      label: 'Security & Password',  Icon: Shield },
                  { key: 'notifications', label: 'Notifications',        Icon: Bell   },
                  { key: 'data',          label: 'Assessment History',   Icon: Clock  },
                ] as const).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      expandedSection === key
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleSection(key)}
                  >
                    <Icon size={18} className="mr-3" />
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="mt-6 bg-primary-50 rounded-xl p-4 border border-primary-100">
            <h3 className="font-semibold mb-2 flex items-center">
              <Shield size={18} className="text-primary-600 mr-2" />
              Data Privacy
            </h3>
            <p className="text-sm text-gray-700">
              Your data is securely stored and never shared with third parties without your explicit consent.
            </p>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Profile Information */}
          {expandedSection === 'profile' && (
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <User size={20} className="text-primary-600 mr-2" />
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                </div>
                <button className="text-gray-400 hover:text-gray-500" onClick={() => toggleSection('profile')}>
                  <ChevronUp size={20} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleUpdateProfile}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User size={18} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="name"
                          autoComplete="username"
                          className="input pl-10"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="john_doe"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Letters, numbers, underscores (_), and dots (.) only.</p>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={18} className="text-gray-400" />
                        </div>
                        <input type="email" id="email" className="input pl-10 bg-gray-50" value={email} readOnly disabled />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Email address cannot be changed for security reasons.</p>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="btn-primary flex items-center" disabled={profileSaving}>
                        {profileSaving ? <><Spinner />Saving...</> : <><Save size={18} className="mr-1" />Save Changes</>}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Security & Password */}
          {expandedSection === 'security' && (
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <Shield size={20} className="text-primary-600 mr-2" />
                  <h2 className="text-xl font-semibold">Security & Password</h2>
                </div>
                <button className="text-gray-400 hover:text-gray-500" onClick={() => toggleSection('security')}>
                  <ChevronUp size={20} />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleUpdatePassword}>
                  <div className="space-y-6">
                    {[
                      { id: 'current-password', label: 'Current Password',     value: currentPassword, setter: setCurrentPassword, show: showCurrentPassword, toggler: setShowCurrentPassword, complete: 'current-password' },
                      { id: 'new-password',      label: 'New Password',         value: newPassword,     setter: setNewPassword,     show: showNewPassword,     toggler: setShowNewPassword,     complete: 'new-password' },
                      { id: 'confirm-password',  label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, show: showConfirmPassword, toggler: setShowConfirmPassword, complete: 'new-password' },
                    ].map(({ id, label, value, setter, show, toggler, complete }) => (
                      <div key={id}>
                        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-gray-400" />
                          </div>
                          <input
                            type={show ? 'text' : 'password'}
                            id={id}
                            autoComplete={complete}
                            className={`input pl-10 pr-10 ${
                              id === 'confirm-password' && confirmPassword && confirmPassword !== newPassword
                                ? 'border-red-300' : ''
                            }`}
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                          />
                          <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600" onClick={() => toggler(v => !v)}>
                            {show ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {id === 'confirm-password' && confirmPassword && confirmPassword !== newPassword && (
                          <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
                        )}
                      </div>
                    ))}
                    <div className="pt-4 flex justify-end">
                      <button type="submit" className="btn-primary flex items-center" disabled={passwordSaving}>
                        {passwordSaving ? <><Spinner />Updating...</> : <><Save size={18} className="mr-1" />Update Password</>}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Notifications */}
          {expandedSection === 'notifications' && (
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <Bell size={20} className="text-primary-600 mr-2" />
                  <h2 className="text-xl font-semibold">Notification Preferences</h2>
                </div>
                <button className="text-gray-400 hover:text-gray-500" onClick={() => toggleSection('notifications')}>
                  <ChevronUp size={20} />
                </button>
              </div>
              <div className="p-6">
                {notifLoading ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : (
                  <div className="space-y-6">

                    {/* Toggles */}
                    {([
                      { key: 'emailNotifications',  label: 'Email Notifications',  desc: 'Master switch — enables all email reminders below' },
                      { key: 'assessmentReminders', label: 'Assessment Reminders', desc: 'Daily reminder to take your periodic PHQ-9 / GAD-7 assessment' },
                      { key: 'moodCheckIns',        label: 'Mood Check-ins',       desc: 'Daily reminder to log your mood, sleep, and energy' },
                      { key: 'newResources',        label: 'New Resources',        desc: 'Notifications about new mental health articles and videos' },
                    ] as { key: keyof NotificationPrefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">{label}</h3>
                          <p className="text-sm text-gray-500">{desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notifPrefs[key] as boolean}
                            onChange={() => toggleNotif(key)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                      </div>
                    ))}

                    {/* Reminder time picker — only shown when email notifications are on */}
                    {notifPrefs.emailNotifications && (
                      <div className="pt-2 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Daily Reminder Time
                        </label>
                        <p className="text-sm text-gray-500 mb-3">
                          You'll receive enabled reminders by email at this time each day (when you open the app).
                        </p>
                        <div className="flex items-center gap-3">
                          <Clock size={18} className="text-primary-500 flex-shrink-0" />
                          <input
                            type="time"
                            value={notifPrefs.reminderTime}
                            onChange={(e) =>
                              setNotifPrefs(prev => ({ ...prev, reminderTime: e.target.value }))
                            }
                            className="input w-36"
                          />
                          <span className="text-sm text-gray-500">
                            (your local time)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Info note */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                      💡 Reminders are sent when you open MindfulCheck at or after your chosen time. Make sure to open the app daily to receive them.
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button className="btn-primary flex items-center" onClick={handleSaveNotifications} disabled={notifSaving}>
                        {notifSaving ? <><Spinner />Saving...</> : <><Save size={18} className="mr-1" />Save Preferences</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assessment History */}
          {expandedSection === 'data' && (
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <Clock size={20} className="text-primary-600 mr-2" />
                  <h2 className="text-xl font-semibold">Assessment History</h2>
                </div>
                <button className="text-gray-400 hover:text-gray-500" onClick={() => toggleSection('data')}>
                  <ChevronUp size={20} />
                </button>
              </div>
              <div className="p-6">
                {assessmentsLoading ? (
                  <div className="flex justify-center py-8">
                    <svg className="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                ) : assessments.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <Clock size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No assessments yet</p>
                    <p className="text-sm mt-1">Complete an assessment and it will appear here.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50">
                            {['Date', 'Assessment', 'Score', 'Severity', 'Actions'].map(h => (
                              <th key={h} className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {assessments.map(a => (
                            <tr key={a.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(a.date)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{a.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{a.score}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${a.severityColor}`}>{a.severity}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button className="text-primary-600 hover:text-primary-800 text-sm font-medium" onClick={() => setSelectedAssessment(a)}>View</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Detail modal */}
                    {selectedAssessment && (
                      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" onClick={() => setSelectedAssessment(null)}>
                        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
                          <h3 className="text-lg font-semibold mb-4">{selectedAssessment.type}</h3>
                          <dl className="space-y-3 text-sm">
                            <div className="flex justify-between"><dt className="text-gray-500">Date</dt><dd className="font-medium">{formatDate(selectedAssessment.date)}</dd></div>
                            <div className="flex justify-between"><dt className="text-gray-500">Score</dt><dd className="font-medium">{selectedAssessment.score}</dd></div>
                            <div className="flex justify-between items-center"><dt className="text-gray-500">Severity</dt><dd><span className={`px-2 py-1 text-xs rounded-full font-medium ${selectedAssessment.severityColor}`}>{selectedAssessment.severity}</span></dd></div>
                          </dl>
                          <button className="mt-6 btn-primary w-full" onClick={() => setSelectedAssessment(null)}>Close</button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium mb-2">Data Export</h3>
                  <p className="text-sm text-gray-600 mb-3">Export all your assessment data and history as a CSV file.</p>
                  <button className="btn-outline text-sm flex items-center gap-2" onClick={handleExportData} disabled={assessmentsLoading}>
                    <Download size={16} />
                    Export My Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;