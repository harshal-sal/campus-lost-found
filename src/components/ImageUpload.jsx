

import React, { useState, useRef } from 'react';
import { compressItemImage } from '../utils/image.js';
import { useToast } from './Toast.jsx';

export default function ImageUpload({ value, onChange }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setProcessing(true);
    try {
      const compressed = await compressItemImage(file);
      onChange(compressed);
      toast.info('Photo compressed and ready.');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setProcessing(false);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div>
      <label className="form-label d-flex flex-wrap align-items-center justify-content-between gap-1">
        <span>Item Photo (Optional)</span>
        <span className="small fw-normal text-muted-campus">
          Max 5 MB · Auto-compressed to 800px JPEG
        </span>
      </label>

      {value ? (
        <div
          className="p-3 rounded-3 border bg-light"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="d-flex flex-column flex-sm-row align-items-sm-center gap-3">
            <img
              src={value}
              alt="Item upload preview"
              className="rounded-3 border"
              style={{
                width: '160px',
                height: '100px',
                objectFit: 'cover',
                backgroundColor: '#fff',
              }}
            />
            <div className="flex-grow-1">
              <div className="fw-semibold small mb-1" style={{ color: 'var(--navy)' }}>
                Photo attached
              </div>
              <div className="small text-muted-campus mb-2">
                Compressed and ready to upload securely.
              </div>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-campus-outline"
                  style={{ minHeight: '34px' }}
                  onClick={() => inputRef.current?.click()}
                >
                  <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
                  Replace Photo
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  style={{ minHeight: '34px', borderRadius: '8px' }}
                  onClick={() => {
                    onChange('');
                    setError('');
                  }}
                >
                  <i className="bi bi-trash me-1" aria-hidden="true" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`image-dropzone ${dragging ? 'dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          {processing ? (
            <div className="py-2">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
              <span className="small fw-medium">Compressing photo...</span>
            </div>
          ) : (
            <>
              <i
                className="bi bi-cloud-arrow-up fs-2 d-block mb-1"
                style={{ color: 'var(--royal)' }}
                aria-hidden="true"
              />
              <div className="fw-semibold small" style={{ color: 'var(--navy)' }}>
                Drag &amp; drop an image here, or click to browse
              </div>
              <div className="small text-muted-campus mt-1">
                PNG, JPG, or WebP up to 5 MB
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="d-none"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <div className="text-danger small mt-2">{error}</div>}
    </div>
  );
}
