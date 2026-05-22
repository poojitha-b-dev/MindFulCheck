import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Smile,
  Frown,
  Moon,
  Sun,
  CloudRain,
  Zap,
  Save,
  Activity,
  X,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';

// Module-level cache references — kept in sync with MoodTrackerPage's cache
// Import these from a shared cache module if you extract the cache later.
// For now, RecordTodayModal accepts callbacks so MoodTrackerPage stays in control.

interface RecordTodayModalProps {
  onClose: () => void;
  onSaved?: () => void; // optional callback to notify parent of successful save
}

const activityOptions = [
  'Exercise', 'Meditation', 'Reading', 'Socializing', 'Work', 'Hobbies',
  'Outdoor time', 'Music', 'Cooking', 'Gaming', 'Learning', 'Relaxing',
];

const getMoodColor = (value: number) => {
  if (value >= 8) return '#50C878';
  if (value >= 5) return '#F59E0B';
  return '#EF4444';
};

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

const RecordTodayModal: React.FC<RecordTodayModalProps> = ({ onClose, onSaved }) => {
  const { currentUser } = useAuth();

  const [moodValue, setMoodValue] = useState(7);
  const [energyValue, setEnergyValue] = useState(6);
  const [sleepValue, setSleepValue] = useState(7);
  const [anxietyValue, setAnxietyValue] = useState(4);
  const [socialValue, setSocialValue] = useState(6);
  const [exerciseValue, setExerciseValue] = useState(5);
  const [workStressValue, setWorkStressValue] = useState(4);
  const [notes, setNotes] = useState('');
  const [activities, setActivities] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggleActivity = (activity: string) => {
    setActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isSaving) return;

    setSaveError(null);
    const todayKey = getTodayKey();

    const entryData = {
      mood: moodValue,
      energy: energyValue,
      sleep: sleepValue,
      anxiety: anxietyValue,
      socialInteraction: socialValue,
      exercise: exerciseValue,
      workStress: workStressValue,
      notes,
      activities,
      timestamp: Timestamp.fromDate(new Date()),
    };

    setIsSaving(true);

    try {
      const moodsRef = collection(db, 'users', currentUser.uid, 'moods');

      // One-per-day enforcement: doc ID is the date string
      await setDoc(doc(moodsRef, todayKey), entryData);

      // 30-day retention cleanup — fire-and-forget, never blocks UI
      getDocs(query(moodsRef, orderBy('timestamp', 'asc'))).then(snapshot => {
        if (snapshot.size > 30) {
          snapshot.docs.slice(0, snapshot.size - 30).forEach(d =>
            deleteDoc(d.ref).catch(() => {})
          );
        }
      }).catch(() => {});

      // Auto-close after successful save
      setIsSaving(false);
      onSaved?.();
      onClose();
    } catch (error) {
      console.error('Error saving mood entry:', error);
      setSaveError('Failed to save entry. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Record Today's Wellbeing</h2>
          {/* X button is always enabled — no isSaving guard */}
          <button
            className="text-gray-400 hover:text-gray-500"
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {saveError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {saveError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mood Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How are you feeling today?
              </label>
              <div className="flex items-center space-x-4">
                <Frown size={24} className="text-error-500" />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodValue}
                  onChange={(e) => setMoodValue(parseInt(e.target.value))}
                  className="flex-grow h-2 rounded-lg appearance-none bg-gray-200"
                  style={{
                    background: `linear-gradient(to right, ${getMoodColor(moodValue)} 0%, ${getMoodColor(moodValue)} ${(moodValue / 10) * 100}%, #E5E7EB ${(moodValue / 10) * 100}%, #E5E7EB 100%)`,
                  }}
                />
                <Smile size={24} className="text-secondary-500" />
                <span className="w-8 text-center font-medium">{moodValue}</span>
              </div>
            </div>

            {/* Sleep Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sleep quality last night
              </label>
              <div className="flex items-center space-x-4">
                <Moon size={24} className="text-gray-400" />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={sleepValue}
                  onChange={(e) => setSleepValue(parseInt(e.target.value))}
                  className="flex-grow h-2 rounded-lg appearance-none bg-gray-200"
                  style={{
                    background: `linear-gradient(to right, #B19CD9 0%, #B19CD9 ${(sleepValue / 10) * 100}%, #E5E7EB ${(sleepValue / 10) * 100}%, #E5E7EB 100%)`,
                  }}
                />
                <Moon size={24} className="text-accent-500" />
                <span className="w-8 text-center font-medium">{sleepValue}</span>
              </div>
            </div>

            {/* Energy Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy level
              </label>
              <div className="flex items-center space-x-4">
                <Zap size={24} className="text-gray-400" />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={energyValue}
                  onChange={(e) => setEnergyValue(parseInt(e.target.value))}
                  className="flex-grow h-2 rounded-lg appearance-none bg-gray-200"
                  style={{
                    background: `linear-gradient(to right, #50C878 0%, #50C878 ${(energyValue / 10) * 100}%, #E5E7EB ${(energyValue / 10) * 100}%, #E5E7EB 100%)`,
                  }}
                />
                <Zap size={24} className="text-secondary-500" />
                <span className="w-8 text-center font-medium">{energyValue}</span>
              </div>
            </div>

            {/* Anxiety Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anxiety level
              </label>
              <div className="flex items-center space-x-4">
                <CloudRain size={24} className="text-gray-400" />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={anxietyValue}
                  onChange={(e) => setAnxietyValue(parseInt(e.target.value))}
                  className="flex-grow h-2 rounded-lg appearance-none bg-gray-200"
                  style={{
                    background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${(anxietyValue / 10) * 100}%, #E5E7EB ${(anxietyValue / 10) * 100}%, #E5E7EB 100%)`,
                  }}
                />
                <CloudRain size={24} className="text-warning-500" />
                <span className="w-8 text-center font-medium">{anxietyValue}</span>
              </div>
            </div>

            {/* Social Interaction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social interaction quality
              </label>
              <div className="flex items-center space-x-4">
                <User size={24} className="text-gray-400" />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={socialValue}
                  onChange={(e) => setSocialValue(parseInt(e.target.value))}
                  className="flex-grow h-2 rounded-lg appearance-none bg-gray-200"
                  style={{
                    background: `linear-gradient(to right, #4A90E2 0%, #4A90E2 ${(socialValue / 10) * 100}%, #E5E7EB ${(socialValue / 10) * 100}%, #E5E7EB 100%)`,
                  }}
                />
                <User size={24} className="text-primary-500" />
                <span className="w-8 text-center font-medium">{socialValue}</span>
              </div>
            </div>

            {/* Exercise */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Physical activity level
              </label>
              <div className="flex items-center space-x-4">
                <Activity size={24} className="text-gray-400" />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={exerciseValue}
                  onChange={(e) => setExerciseValue(parseInt(e.target.value))}
                  className="flex-grow h-2 rounded-lg appearance-none bg-gray-200"
                  style={{
                    background: `linear-gradient(to right, #50C878 0%, #50C878 ${(exerciseValue / 10) * 100}%, #E5E7EB ${(exerciseValue / 10) * 100}%, #E5E7EB 100%)`,
                  }}
                />
                <Activity size={24} className="text-secondary-500" />
                <span className="w-8 text-center font-medium">{exerciseValue}</span>
              </div>
            </div>
          </div>

          {/* Activities */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activities today (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {activityOptions.map((activity) => (
                <button
                  key={activity}
                  type="button"
                  onClick={() => toggleActivity(activity)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    activities.includes(activity)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was your day? Any significant events or feelings?"
              className="input"
            ></textarea>
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            {/* Cancel is always clickable — no disabled prop */}
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-1" />
                  Save Entry
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RecordTodayModal;
