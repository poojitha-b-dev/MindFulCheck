import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  AlertCircle, 
  Check, 
  Eye, 
  EyeOff,
  ChevronDown, 
  ChevronUp, 
  Shield, 
  Bell,
  Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { currentUser, updateUserProfile } = useAuth();
  
  const [name, setName] = useState(currentUser?.displayName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [expandedSection, setExpandedSection] = useState<string | null>('profile');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setErrorMessage('Name cannot be empty');
      return;
    }
    
    try {
      setSaving(true);
      setErrorMessage('');
      
      await updateUserProfile({
        displayName: name,
      });
      
      setSuccessMessage('Profile updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    
    // In a real app, implement password update logic here
    setErrorMessage('Password update functionality not implemented in this demo');
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>
      
      {successMessage && (
        <div className="mb-6 bg-secondary-50 border border-secondary-200 text-secondary-700 px-4 py-3 rounded-lg flex items-center">
          <Check size={20} className="mr-2 text-secondary-500" />
          <span>{successMessage}</span>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2 text-error-500" />
          <span>{errorMessage}</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
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
                <button 
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    expandedSection === 'profile'
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSection('profile')}
                >
                  <User size={18} className="mr-3" />
                  Profile Information
                </button>
                
                <button 
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    expandedSection === 'security'
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSection('security')}
                >
                  <Shield size={18} className="mr-3" />
                  Security & Password
                </button>
                
                <button 
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    expandedSection === 'notifications'
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSection('notifications')}
                >
                  <Bell size={18} className="mr-3" />
                  Notifications
                </button>
                
                <button 
                  className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    expandedSection === 'data'
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSection('data')}
                >
                  <Clock size={18} className="mr-3" />
                  Assessment History
                </button>
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
        
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Profile Information */}
          {expandedSection === 'profile' && (
            <div className="bg-white rounded-xl shadow-soft overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center">
                  <User size={20} className="text-primary-600 mr-2" />
                  <h2 className="text-xl font-semibold">Profile Information</h2>
                </div>
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => toggleSection('profile')}
                >
                  <ChevronUp size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleUpdateProfile}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User size={18} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="name"
                          className="input pl-10"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
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
                      <button
                        type="submit"
                        className="btn-primary flex items-center"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                              <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={18} className="mr-1" /> Save Changes
                          </>
                        )}
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
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => toggleSection('security')}
                >
                  <ChevronUp size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleUpdatePassword}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="current-password"
                          className="input pl-10 pr-10"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? (
                            <EyeOff size={18} className="text-gray-400" />
                          ) : (
                            <Eye size={18} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="new-password"
                          className="input pl-10 pr-10"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff size={18} className="text-gray-400" />
                          ) : (
                            <Eye size={18} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirm-password"
                          className="input pl-10 pr-10"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} className="text-gray-400" />
                          ) : (
                            <Eye size={18} className="text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        className="btn-primary flex items-center"
                      >
                        <Save size={18} className="mr-1" /> Update Password
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
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => toggleSection('notifications')}
                >
                  <ChevronUp size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive email updates about your account and assessments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Assessment Reminders</h3>
                      <p className="text-sm text-gray-500">Receive reminders to take periodic assessments</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Mood Check-ins</h3>
                      <p className="text-sm text-gray-500">Receive reminders to log your daily mood</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-gray-900">New Resources</h3>
                      <p className="text-sm text-gray-500">Receive notifications about new mental health resources</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button className="btn-primary flex items-center">
                      <Save size={18} className="mr-1" /> Save Preferences
                    </button>
                  </div>
                </div>
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
                <button
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => toggleSection('data')}
                >
                  <ChevronUp size={20} />
                </button>
              </div>
              
              <div className="p-6">
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
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">May 15, 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap">Depression (PHQ-9)</td>
                        <td className="px-6 py-4 whitespace-nowrap">5</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-secondary-100 text-secondary-800">Mild</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-primary-600 hover:text-primary-800">View</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">May 15, 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap">Anxiety (GAD-7)</td>
                        <td className="px-6 py-4 whitespace-nowrap">7</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-warning-100 text-warning-800">Moderate</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-primary-600 hover:text-primary-800">View</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">May 1, 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap">Depression (PHQ-9)</td>
                        <td className="px-6 py-4 whitespace-nowrap">8</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-warning-100 text-warning-800">Moderate</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-primary-600 hover:text-primary-800">View</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">May 1, 2025</td>
                        <td className="px-6 py-4 whitespace-nowrap">Anxiety (GAD-7)</td>
                        <td className="px-6 py-4 whitespace-nowrap">9</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-warning-100 text-warning-800">Moderate</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button className="text-primary-600 hover:text-primary-800">View</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium mb-2">Data Export</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    You can export all your assessment data and history as a CSV file.
                  </p>
                  <button className="btn-outline text-sm">
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