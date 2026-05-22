import React, { useEffect, useState } from 'react';
import { validatePassword } from '../../contexts/AuthContext';

interface PasswordStrengthProps {
  password: string;
}

const strengthConfig = {
  weak:     { label: 'Weak password',     color: '#ef4444', bar: 'w-1/3' },
  moderate: { label: 'Moderate password', color: '#f59e0b', bar: 'w-2/3' },
  strong:   { label: 'Strong password',   color: '#22c55e', bar: 'w-full' },
};

const PasswordStrengthMeter: React.FC<PasswordStrengthProps> = ({ password }) => {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!password) {
      setVisible(false);
      setFadeOut(false);
      return;
    }

    // Show immediately
    setVisible(true);
    setFadeOut(false);

    // Start fade-out after 1.4s, fully gone by 1.8s
    const fadeTimer = setTimeout(() => setFadeOut(true), 1400);
    const hideTimer = setTimeout(() => setVisible(false), 1800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [password]);

  if (!password || !visible) return null;

  const { strength } = validatePassword(password);
  const config = strengthConfig[strength];

  return (
    <div
      style={{
        transition: 'opacity 0.4s ease',
        opacity: fadeOut ? 0 : 1,
      }}
      className="mt-2 space-y-1"
    >
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${config.bar}`}
          style={{ backgroundColor: config.color }}
        />
      </div>
      <p className="text-xs" style={{ color: config.color }}>
        {config.label}
      </p>
    </div>
  );
};

export default PasswordStrengthMeter;
