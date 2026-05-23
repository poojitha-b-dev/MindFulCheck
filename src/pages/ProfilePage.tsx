import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Save,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Clock,
  Download,
  ChevronUp,
} from 'lucide-react';
import { useAuth, validateName, validatePassword, getFirebaseErrorMessage } from '../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssessmentRecord {
  id: string;
  date: string; // ISO string
  type: string; // e.g. "Depression (PHQ-9)"
  score: number;
  severity: string; // e.g. "Mild"
  severityColor: string; // Tailwind badge classes
}

interface NotificationPrefs {
  emailNotifications: boolean;
  assessmentReminders: boolean;
  moodCheckIns: boolean;
  newResources: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityBadge(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'none':
    case 'minimal': return 'bg-green-100 text-green-800';
    case 'mild':    return 'bg-secondary-100 text-secondary-800';
    case 'moderate':return 'bg-warning-100 text-warning-800';
    case 'severe':
    case 'moderately severe': return 'bg-red-100 text-red-800';
    default:        return 'bg-gray-100 text-gray-800';
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
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

  // ── Profile section ──
  const [name, setName]           = useState(currentUser?.displayName || '');
  const [email]                   = useState(currentUser?.email || '');
  const [profileSaving, setProfileSaving]   = useState(false);

  // ── Security section ──
  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving]     = useState(false);

  // ── Notification section ──
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    emailNotifications: true,
    assessmentReminders: true,
    moodCheckIns: true,
    newResources: false,
  });
  const [notifSaving, setNotifSaving]   = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  // ── Assessment history section ──
  const [assessments, setAssessments]     = useState<AssessmentRecord[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);

  // ── Shared UI ──
  const [expandedSection, setExpandedSection] = useState<string | null>('profile');
  const [successMessage, setSuccessMessage]   = useState('');
  const [errorMessage, setErrorMessage]       = useState('');

  // ── Flash helpers ────────────────────────────────────────────────────────
  const flashSuccess = (msg: string) => {
    setErrorMessage('');
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 4000);
  };
  const flashError = (msg: string) => {
    setSuccessMessage('');
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 6000);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
    setSuccessMessage('');
    setErrorMessage('');
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
            setNotifPrefs(prev => ({ ...prev, ...d.notificationPrefs }));
          }
        }
      })
      .catch(() => {/* silently ignore — UI stays at defaults */})
      .finally(() => setNotifLoading(false));
  }, [currentUser]);

  // ── Load assessment history from Firestore ────────────────────────────────
  useEffect(() => {
    if (expandedSection !== 'data' || !currentUser) return;
    setAssessmentsLoading(true);
    const q = query(
      collection(db, 'assessments'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    getDocs(q)
      .then(snap => {
        const rows: AssessmentRecord[] = snap.docs.map(d => {
          const data = d.data();
          const severity: string = data.severity ?? data.level ?? '—';
          return {
            id: d.id,
            date: data.createdAt?.toDate?.()?.toISOString() ?? '',
            type: data.type ?? data.assessmentType ?? 'Assessment',
            score: data.score ?? data.totalScore ?? 0,
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
    if (!check.isValid) { flashError(check.message); return; }

    try {
      setProfileSaving(true);
      await updateUserProfile({ displayName: name.trim() });
      flashSuccess('Profile updated successfully.');
    } catch (err: any) {
      flashError(getFirebaseErrorMessage(err.code));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { flashError('Please enter your current password.'); return; }
    const pwCheck = validatePassword(newPassword);
    if (!pwCheck.isValid) { flashError(pwCheck.message); return; }
    if (newPassword !== confirmPassword) { flashError('New passwords do not match.'); return; }
    if (newPassword === currentPassword)  { flashError('New password must differ from current password.'); return; }

    try {
      setPasswordSaving(true);
      await updateUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      flashSuccess('Password updated successfully.');
    } catch (err: any) {
      flashError(getFirebaseErrorMessage(err.code));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!currentUser) return;
    try {
      setNotifSaving(true);
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { notificationPrefs: notifPrefs },
        { merge: true }
      );
      flashSuccess('Notification preferences saved.');
    } catch (err: any) {
      flashError('Failed to save preferences. Please try again.');
    } finally {
      setNotifSaving(false);
    }
  };

  const handleExportData = () => {
    if (!assessments.length) {
      flashError('No assessment data to export.');
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
  };

  const toggleNotif = (key: keyof NotificationPrefs) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {successMessage && (
        <div className="mb-6 bg-secondary-50 border border-secondary-200 text-secondary-700 px-4 py-3 rounded-lg flex items-center">
          <Check size={20} className="mr-2 text-secondary-500 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2 text-error-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

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
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
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
                      <p className="mt-1 text-xs text-gray-500">
                        Letters, numbers, underscores (_), and dots (.) only.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={18} className="text-gray-400" />
                        </div>
                        <input
                          type="email"
                          id="email"
                          className="input pl-10 bg-gray-50"
                          value={email}
                          readOnly
                          disabled
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Email address cannot be changed for security reasons.
                      </p>
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
                    {/* Current password */}
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          id="current-password"
                          className="input pl-10 pr-10"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => setShowCurrentPassword(v => !v)}
                          aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          id="new-password"
                          className="input pl-10 pr-10"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => setShowNewPassword(v => !v)}
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm new password */}
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirm-password"
                          className={`input pl-10 pr-10 ${
                            confirmPassword && confirmPassword !== newPassword ? 'border-red-300' : ''
                          }`}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          onClick={() => setShowConfirmPassword(v => !v)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="text-xs text-red-400 mt-1">Passwords do not match.</p>
                      )}
                    </div>

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
                    {([
                      { key: 'emailNotifications',  label: 'Email Notifications',   desc: 'Receive email updates about your account and assessments' },
                      { key: 'assessmentReminders', label: 'Assessment Reminders',  desc: 'Receive reminders to take periodic assessments' },
                      { key: 'moodCheckIns',        label: 'Mood Check-ins',        desc: 'Receive reminders to log your daily mood' },
                      { key: 'newResources',        label: 'New Resources',         desc: 'Receive notifications about new mental health resources' },
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
                            checked={notifPrefs[key]}
                            onChange={() => toggleNotif(key)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                      </div>
                    ))}

                    <div className="pt-4 flex justify-end">
                      <button
                        className="btn-primary flex items-center"
                        onClick={handleSaveNotifications}
                        disabled={notifSaving}
                      >
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
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {assessments.map(a => (
                            <tr key={a.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(a.date)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{a.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{a.score}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${a.severityColor}`}>
                                  {a.severity}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                                  onClick={() => setSelectedAssessment(a)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Assessment detail modal */}
                    {selectedAssessment && (
                      <div
                        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
                        onClick={() => setSelectedAssessment(null)}
                      >
                        <div
                          className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full mx-4"
                          onClick={e => e.stopPropagation()}
                        >
                          <h3 className="text-lg font-semibold mb-4">{selectedAssessment.type}</h3>
                          <dl className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Date</dt>
                              <dd className="font-medium">{formatDate(selectedAssessment.date)}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Score</dt>
                              <dd className="font-medium">{selectedAssessment.score}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                              <dt className="text-gray-500">Severity</dt>
                              <dd>
                                <span className={`px-2 py-1 text-xs rounded-full font-medium ${selectedAssessment.severityColor}`}>
                                  {selectedAssessment.severity}
                                </span>
                              </dd>
                            </div>
                          </dl>
                          <button
                            className="mt-6 btn-primary w-full"
                            onClick={() => setSelectedAssessment(null)}
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium mb-2">Data Export</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Export all your assessment data and history as a CSV file.
                  </p>
                  <button
                    className="btn-outline text-sm flex items-center gap-2"
                    onClick={handleExportData}
                    disabled={assessmentsLoading}
                  >
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
