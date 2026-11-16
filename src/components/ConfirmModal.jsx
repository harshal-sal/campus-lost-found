/**
 * src/components/ConfirmModal.jsx
 * Pure React confirmation modal for destructive or irreversible actions (no Bootstrap JS).
 */

import React, { useEffect } from 'react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isProcessing = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isProcessing) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen) return null;

  const confirmBtnClass =
    variant === 'danger' ? 'btn btn-danger' : 'btn btn-campus-primary';

  return (
    <div
      className="campus-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onCancel();
        }
      }}
    >
      <div className="campus-modal-dialog p-4">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${
                variant === 'danger'
                  ? 'bi-exclamation-triangle-fill text-danger'
                  : 'bi-question-circle-fill text-primary'
              } fs-5`}
              aria-hidden="true"
            />
            <h5 id="confirm-modal-title" className="mb-0">
              {title}
            </h5>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close modal"
            disabled={isProcessing}
            onClick={onCancel}
          />
        </div>

        <p className="text-secondary mb-4" style={{ fontSize: '0.94rem' }}>
          {message}
        </p>

        <div className="d-flex justify-content-end gap-2">
          <button
            type="button"
            className="btn btn-campus-outline"
            disabled={isProcessing}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={confirmBtnClass}
            disabled={isProcessing}
            onClick={onConfirm}
          >
            {isProcessing ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Working...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
