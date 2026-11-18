import React, { useState, useEffect } from 'react';

import { supabase } from '../services/supabase.js';
import { assertCanManageItem, useAuth } from '../utils/auth.js';
import {
  validateItemForm,
  getTodayDateString,
} from '../utils/validation.js';
import { useToast } from './Toast.jsx';
import ImageUpload from './ImageUpload.jsx';

export default function EditItemModal({
  item,
  isOpen,
  onClose,
  onSaved,
}) {
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
  const [loadingOptions, setLoadingOptions] = useState(false);

  // ==========================================
  // LOAD CATEGORIES AND LOCATIONS FROM SUPABASE
  // ==========================================

  useEffect(() => {
    if (!isOpen || !item) return;

    let cancelled = false;

    const loadOptions = async () => {
      setLoadingOptions(true);

      try {
        const [categoryResult, locationResult] = await Promise.all([
          supabase
            .from('categories')
            .select('*')
            .order('category_id'),

          supabase
            .from('locations')
            .select('*')
            .order('location_id'),
        ]);

        if (categoryResult.error) throw categoryResult.error;
        if (locationResult.error) throw locationResult.error;

        if (!cancelled) {
          setCategories(categoryResult.data || []);
          setLocations(locationResult.data || []);
        }
      } catch (error) {
        console.error('Edit form loading error:', error);
        toast.error('Unable to load categories and locations.');
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    };

    setForm({
      title: item.title || '',
      description: item.description || '',
      category_id: String(item.category_id || ''),
      location_id: String(item.location_id || ''),
      date: item.date || getTodayDateString(),
      type: item.type || 'lost',

      // Existing signed URL is used for image preview.
      image: item.image || null,
    });

    setErrors({});

    loadOptions();

    return () => {
      cancelled = true;
    };
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  // ==========================================
  // HANDLE FORM CHANGES
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // ==========================================
  // UPLOAD NEW IMAGE TO SUPABASE STORAGE
  // ==========================================

  const uploadItemImage = async (imageData) => {
    if (!imageData) return null;

    if (!user?.auth_user_id) {
      throw new Error(
        'Authentication profile is incomplete. Please log in again.'
      );
    }

    const response = await fetch(imageData);
    const imageBlob = await response.blob();

    const fileName = `${crypto.randomUUID()}.jpg`;

    const filePath = `${user.auth_user_id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) throw error;

    return data.path;
  };

  // ==========================================
  // SAVE UPDATED ITEM TO SUPABASE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateItemForm(form);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);

    let uploadedImagePath = null;

    try {
      // Check permissions.
      assertCanManageItem(user, item);

      // Do not allow editing returned items.
      if (item.status === 'Returned') {
        throw new Error('Returned items cannot be edited.');
      }

      // Determine whether a new image was selected.
      const imageChanged = form.image !== item.image;

      let finalImagePath = item.imagePath || null;

      if (imageChanged) {
        if (form.image) {
          uploadedImagePath = await uploadItemImage(form.image);
          finalImagePath = uploadedImagePath;
        } else {
          // User removed the existing image.
          finalImagePath = null;
        }
      }

      // Update item in PostgreSQL.
      const updatedItem = {
        title: form.title.trim(),
        description: form.description.trim(),
        category_id: Number(form.category_id),
        location_id: Number(form.location_id),
        date: form.date,
        type: form.type,
        image: finalImagePath,
      };

      const { data, error } = await supabase
        .from('items')
        .update(updatedItem)
        .eq('item_id', item.item_id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Item was not updated.');
      }

      // Delete old image only after database update succeeds.
      if (
        imageChanged &&
        item.imagePath &&
        item.imagePath !== finalImagePath
      ) {
        const { error: removeError } = await supabase.storage
          .from('item-images')
          .remove([item.imagePath]);

        if (removeError) {
          console.error('Old image cleanup error:', removeError);
        }
      }

      toast.success('Item details updated successfully.');

      await onSaved();

      onClose();

    } catch (error) {
      console.error('Item update error:', error);

      // Clean up newly uploaded image if database update failed.
      if (uploadedImagePath) {
        await supabase.storage
          .from('item-images')
          .remove([uploadedImagePath]);
      }

      toast.error(error.message || 'Unable to update item.');

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className="campus-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-item-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) {
          onClose();
        }
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

        {loadingOptions ? (

          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">
                Loading form options...
              </span>
            </div>
          </div>

        ) : (

          <form onSubmit={handleSubmit} noValidate>

            {/* ITEM TITLE */}

            <div className="mb-3">

              <label htmlFor="edit-title" className="form-label">
                Item Title
              </label>

              <input
                id="edit-title"
                name="title"
                type="text"
                className={`form-control ${
                  errors.title ? 'is-invalid' : ''
                }`}
                value={form.title}
                onChange={handleChange}
              />

              {errors.title && (
                <div className="invalid-feedback">
                  {errors.title}
                </div>
              )}

            </div>

            {/* TYPE, CATEGORY AND LOCATION */}

            <div className="row g-3 mb-3">

              <div className="col-md-4">

                <label htmlFor="edit-type" className="form-label">
                  Report Type
                </label>

                <select
                  id="edit-type"
                  name="type"
                  className={`form-select ${
                    errors.type ? 'is-invalid' : ''
                  }`}
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="lost">Lost</option>
                  <option value="found">Found</option>
                </select>

                {errors.type && (
                  <div className="invalid-feedback">
                    {errors.type}
                  </div>
                )}

              </div>

              <div className="col-md-4">

                <label htmlFor="edit-category" className="form-label">
                  Category
                </label>

                <select
                  id="edit-category"
                  name="category_id"
                  className={`form-select ${
                    errors.category_id ? 'is-invalid' : ''
                  }`}
                  value={form.category_id}
                  onChange={handleChange}
                >
                  <option value="">Select category</option>

                  {categories.map((c) => (
                    <option
                      key={c.category_id}
                      value={c.category_id}
                    >
                      {c.category_name}
                    </option>
                  ))}

                </select>

                {errors.category_id && (
                  <div className="invalid-feedback">
                    {errors.category_id}
                  </div>
                )}

              </div>

              <div className="col-md-4">

                <label htmlFor="edit-location" className="form-label">
                  Location
                </label>

                <select
                  id="edit-location"
                  name="location_id"
                  className={`form-select ${
                    errors.location_id ? 'is-invalid' : ''
                  }`}
                  value={form.location_id}
                  onChange={handleChange}
                >
                  <option value="">Select location</option>

                  {locations.map((l) => (
                    <option
                      key={l.location_id}
                      value={l.location_id}
                    >
                      {l.location_name}
                    </option>
                  ))}

                </select>

                {errors.location_id && (
                  <div className="invalid-feedback">
                    {errors.location_id}
                  </div>
                )}

              </div>

            </div>

            {/* DATE */}

            <div className="mb-3">

              <label htmlFor="edit-date" className="form-label">
                Date Lost / Found
              </label>

              <input
                id="edit-date"
                name="date"
                type="date"
                max={getTodayDateString()}
                className={`form-control ${
                  errors.date ? 'is-invalid' : ''
                }`}
                value={form.date}
                onChange={handleChange}
              />

              {errors.date && (
                <div className="invalid-feedback">
                  {errors.date}
                </div>
              )}

            </div>

            {/* DESCRIPTION */}

            <div className="mb-3">

              <label htmlFor="edit-description" className="form-label">
                Description
              </label>

              <textarea
                id="edit-description"
                name="description"
                rows={3}
                className={`form-control ${
                  errors.description ? 'is-invalid' : ''
                }`}
                value={form.description}
                onChange={handleChange}
              />

              {errors.description && (
                <div className="invalid-feedback">
                  {errors.description}
                </div>
              )}

            </div>

            {/* IMAGE UPLOAD */}

            <div className="mb-4">

              <ImageUpload
                value={form.image}
                onChange={(img) =>
                  setForm((prev) => ({
                    ...prev,
                    image: img,
                  }))
                }
              />

            </div>

            {/* BUTTONS */}

            <div className="d-flex justify-content-end gap-2">

              <button
                type="button"
                className="btn btn-campus-outline"
                disabled={saving}
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-campus-primary"
                disabled={saving || loadingOptions}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>

            </div>

          </form>

        )}

      </div>
    </div>
  );
}