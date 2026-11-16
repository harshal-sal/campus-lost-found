/**
 * src/components/Toast.jsx
 * Pure React toast notification provider and viewport renderer (no Bootstrap JS).
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const ICON_MAP = {
  success: 'bi-check-circle-fill',
  error: 'bi-exclamation-octagon-fill',
  warning: 'bi-exclamation-triangle-fill',
  info: 'bi-info-circle-fill',
};

const LABEL_MAP = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Notice',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(1);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success', duration = 4200) => {
      const id = idRef.current++;
      setToasts((prev) => [...prev, { id, message: String(message), type }]);

      if (duration > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
      return id;
    },
    [dismissToast]
  );

  const toastApi = {
    showToast,
    success: (msg) => showToast(msg, 'success'),
    error: (msg) => showToast(msg, 'error', 5500),
    warning: (msg) => showToast(msg, 'warning', 4800),
    info: (msg) => showToast(msg, 'info'),
    dismissToast,
  };

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <div
        className="campus-toast-container"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const iconClass = ICON_MAP[t.type] || ICON_MAP.info;
          const titleLabel = LABEL_MAP[t.type] || LABEL_MAP.info;
          return (
            <div
              key={t.id}
              className={`campus-toast campus-toast-${t.type}`}
              role="alert"
            >
              <i className={`bi ${iconClass} campus-toast-icon fs-5 mt-1`} aria-hidden="true" />
              <div className="flex-grow-1 min-w-0">
                <div className="fw-semibold small" style={{ color: 'var(--campus-navy)' }}>
                  {titleLabel}
                </div>
                <div className="small text-secondary" style={{ wordBreak: 'break-word' }}>
                  {t.message}
                </div>
              </div>
              <button
                type="button"
                className="btn-close btn-sm ms-1"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(t.id)}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return ctx;
}
