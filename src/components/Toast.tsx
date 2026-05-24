/**
 * Toast.tsx
 *
 * A fixed-position, portal-rendered toast notification.
 * Shows in the bottom-right corner of the viewport so it is always visible
 * regardless of scroll position.
 *
 * Usage:
 *   const [toast, setToast] = useState<ToastState | null>(null);
 *   showToast(setToast, 'success', 'Saved!');           // auto-hides in 4 s
 *   showToast(setToast, 'error', 'Wrong password.', 6000);
 *
 *   <Toast toast={toast} onDismiss={() => setToast(null)} />
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

export type ToastKind = 'success' | 'error';

export interface ToastState {
  kind: ToastKind;
  message: string;
  /** Auto-dismiss after this many ms (default 4000). 0 = never auto-dismiss. */
  duration?: number;
}

interface ToastProps {
  toast: ToastState | null;
  onDismiss: () => void;
}

const STYLES: Record<ToastKind, { wrapper: string; icon: React.ReactNode }> = {
  success: {
    wrapper:
      'bg-white border border-green-200 text-green-800 shadow-lg',
    icon: <CheckCircle size={20} className="text-green-500 flex-shrink-0" />,
  },
  error: {
    wrapper:
      'bg-white border border-red-200 text-red-800 shadow-lg',
    icon: <AlertCircle size={20} className="text-red-500 flex-shrink-0" />,
  },
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const ms = toast.duration ?? 4000;
    if (ms <= 0) return;
    const id = setTimeout(onDismiss, ms);
    return () => clearTimeout(id);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const { wrapper, icon } = STYLES[toast.kind];

  return createPortal(
    <div
      role="alert"
      aria-live="polite"
      className={`
        fixed bottom-6 right-6 z-[9999]
        flex items-center gap-3 px-5 py-4
        rounded-xl max-w-sm w-full
        animate-slideUp
        ${wrapper}
      `}
      style={{ animation: 'slideUp 0.25s ease-out' }}
    >
      {icon}
      <span className="flex-1 text-sm font-medium leading-snug">{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
      >
        <X size={16} />
      </button>

      {/* Inline keyframe — avoids needing a global CSS file */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>,
    document.body
  );
};

/**
 * Helper to fire a toast from any component that holds a ToastState setter.
 */
export function showToast(
  setter: React.Dispatch<React.SetStateAction<ToastState | null>>,
  kind: ToastKind,
  message: string,
  duration = 4000
): void {
  setter({ kind, message, duration });
}

export default Toast;
