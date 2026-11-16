/**
 * src/components/EditItemModal.jsx
 * Reusable React modal for editing an Open or Claimed item, including optional photo upload.
 */

import React, { useState, useEffect } from 'react';
import { getAll, update } from '../services/db.js';
import { assertCanManageItem, useAuth } from '../utils/auth.js';
import { validateItemForm, getTodayDateString } from '../utils/validation.js';
import { useToast } from './Toast.jsx';
import ImageUpload from './ImageUpload.jsx';

export default function EditItemModal({ item, isOpen, onClose, onSaved }) {
  const { user } = useAuth();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    location_id: '',
    date: '',
    type: 'lost',
    image: null,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setCategories(getAll('categories'));
    setLocations(getAll('locations'));
    setForm({
      title: item.title || '',
      description: item.description || '',
      category_id: String(item.category_id || ''),
      location_id: String(item.location_id || ''),
      date: item.date || getTodayDateString(),
      type: item.type || 'lost',
      image: item.image || null,
    });
    setErrors({});
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateItemForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    try {
      assertCanManageItem(user, item);
      const updated = update('items', item.item_id, {
        title: form.title,
        description: form.description,
        category_id: Number(form.category_id),
        location_id: Number(form.location_id),
        date: form.date,
        type: form.type,
        image: form.image || '',
      });
      toast.success('Item details updated successfully.');
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="campus-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-item-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="campus-modal-dialog modal-lg-custom p-4">
        <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
          <h5 id="edit-item-modal-title" className="mb-0">
            Edit Item #{item.item_id}
          </h5>
          <button
            type="button"
            className="btn-close"
            aria-label="Close edit modal"
            disabled={saving}
            onClick={onClose}
          />
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="edit-title" className="form-label">
              Item Title
            </label>
            <input
              id="edit-title"
              name="title"
              type="text"
              className={`form-control ${errors.title ? 'is-invalid' : ''}`}
              value={form.title}
              onChange={handleChange}
            />
            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-4">
              <label htmlFor="edit-type" className="form-label">
                Report Type
              </label>
              <select
                id="edit-type"
                name="type"
                className={`form-select ${errors.type ? 'is-invalid' : ''}`}
                value={form.type}
                onChange={handleChange}
              >
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
              {errors.type && <div className="invalid-feedback">{errors.type}</div>}
            </div>

            <div className="col-md-4">
              <label htmlFor="edit-category" className="form-label">
                Category
              </label>
              <select
                id="edit-category"
                name="category_id"
                className={`form-select ${errors.category_id ? 'is-invalid' : ''}`}
                value={form.category_id}
                onChange={handleChange}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <div className="invalid-feedback">{errors.category_id}</div>
              )}
            </div>

            <div className="col-md-4">
              <label htmlFor="edit-location" className="form-label">
                Location
              </label>
              <select
                id="edit-location"
                name="location_id"
                className={`form-select ${errors.location_id ? 'is-invalid' : ''}`}
                value={form.location_id}
                onChange={handleChange}
              >
                <option value="">Select location</option>
                {locations.map((l) => (
                  <option key={l.location_id} value={l.location_id}>
                    {l.location_name}
                  </option>
                ))}
              </select>
              {errors.location_id && (
                <div className="invalid-feedback">{errors.location_id}</div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="edit-date" className="form-label">
              Date Lost / Found
            </label>
            <input
              id="edit-date"
              name="date"
              type="date"
              max={getTodayDateString()}
              className={`form-control ${errors.date ? 'is-invalid' : ''}`}
              value={form.date}
              onChange={handleChange}
            />
            {errors.date && <div className="invalid-feedback">{errors.date}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="edit-description" className="form-label">
              Description
            </label>
            <textarea
              id="edit-description"
              name="description"
              rows={3}
              className={`form-control ${errors.description ? 'is-invalid' : ''}`}
              value={form.description}
              onChange={handleChange}
            />
            {errors.description && (
              <div className="invalid-feedback">{errors.description}</div>
            )}
          </div>

          <div className="mb-4">
            <ImageUpload
              value={form.image}
              onChange={(img) => setForm((prev) => ({ ...prev, image: img }))}
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-campus-outline"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-campus-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
