import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { supabase } from '../services/supabase.js';
import { useAuth } from '../utils/auth.js';
import { validateItemForm, getTodayDateString } from '../utils/validation.js';
import { useToast } from '../components/Toast.jsx';
import ImageUpload from '../components/ImageUpload.jsx';

export default function ReportItem() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialType =
    searchParams.get('type') === 'lost' ? 'lost' : 'found';

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    location_id: '',
    date: getTodayDateString(),
    type: initialType,
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch categories and locations
  useEffect(() => {
    const fetchFormOptions = async () => {
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

        if (categoryResult.error) {
          throw categoryResult.error;
        }

        if (locationResult.error) {
          throw locationResult.error;
        }

        setCategories(categoryResult.data || []);
        setLocations(locationResult.data || []);
      } catch (err) {
        console.error('Error fetching form options:', err);
        toast.error('Unable to load categories and locations.');
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchFormOptions();
  }, []);

  // Handle lost/found query parameter
  useEffect(() => {
    const paramType = searchParams.get('type');

    if (paramType === 'lost' || paramType === 'found') {
      setForm((prev) => ({
        ...prev,
        type: paramType,
      }));
    }
  }, [searchParams]);

  // Handle form changes
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

  // Upload compressed image to Supabase Storage
  const uploadItemImage = async (imageData) => {
    if (!imageData) return null;

    if (!user?.auth_user_id) {
      throw new Error('Your authentication profile is incomplete. Please log in again.');
    }

    // Convert compressed Base64/data URL into a Blob
    const response = await fetch(imageData);
    const imageBlob = await response.blob();

    // Generate a unique storage path inside the user's folder
    const fileName = `${crypto.randomUUID()}.jpg`;
    const filePath = `${user.auth_user_id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(filePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return data.path;
  };

  // Submit item
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateItemForm(form);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (!user?.user_id) {
      toast.error('Please log in before reporting an item.');
      navigate('/login');
      return;
    }

    setSubmitting(true);

    let uploadedImagePath = null;

    try {
      // Step 1: Upload image if selected
      if (form.image) {
        toast.info('Uploading your photo...');

        uploadedImagePath = await uploadItemImage(form.image);
      }

      // Step 2: Prepare item data
      const itemData = {
        user_id: user.user_id,
        category_id: Number(form.category_id),
        location_id: Number(form.location_id),
        title: form.title.trim(),
        description: form.description.trim(),
        date: form.date,
        type: form.type,
        status: 'Open',
        image: uploadedImagePath,
      };

      // Step 3: Insert item into PostgreSQL
      const { data, error } = await supabase
        .from('items')
        .insert([itemData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Item reported successfully!');

      navigate(`/items/${data.item_id}`);

    } catch (err) {
      console.error('Error reporting item:', err);

      // Remove uploaded image if database insertion fails
      if (uploadedImagePath) {
        const { error: cleanupError } = await supabase.storage
          .from('item-images')
          .remove([uploadedImagePath]);

        if (cleanupError) {
          console.error('Image cleanup failed:', cleanupError);
        }
      }

      toast.error(err.message || 'Unable to report item.');

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4 py-md-5 page-fade">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">

          <div className="mb-3">
            <Link to="/" className="text-decoration-none small text-muted-campus">
              <i className="bi bi-arrow-left me-1" aria-hidden="true" />
              Back to Browse Board
            </Link>
          </div>

          <div className="campus-card p-4 p-md-5">

            <div className="mb-4">
              <h1 className="h3 mb-1">
                Report Lost or Found Item
              </h1>

              <p className="text-muted-campus small mb-0">
                Provide accurate location, identifying notes, and an optional
                photo to help reunite belongings quickly.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>

              {/* Report Type */}
              <div className="mb-3">
                <label className="form-label d-block">
                  Report Type
                </label>

                <div className="d-flex flex-wrap gap-3">

                  <div className="form-check">
                    <input
                      id="type-found"
                      name="type"
                      type="radio"
                      className="form-check-input"
                      value="found"
                      checked={form.type === 'found'}
                      onChange={handleChange}
                    />

                    <label
                      htmlFor="type-found"
                      className="form-check-label fw-medium"
                    >
                      Found Item (I found something)
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      id="type-lost"
                      name="type"
                      type="radio"
                      className="form-check-input"
                      value="lost"
                      checked={form.type === 'lost'}
                      onChange={handleChange}
                    />

                    <label
                      htmlFor="type-lost"
                      className="form-check-label fw-medium"
                    >
                      Lost Item (I lost something)
                    </label>
                  </div>

                </div>

                {errors.type && (
                  <div className="text-danger small mt-1">
                    {errors.type}
                  </div>
                )}
              </div>

              {/* Item Title */}
              <div className="mb-3">
                <label htmlFor="report-title" className="form-label">
                  Item Title
                </label>

                <input
                  id="report-title"
                  name="title"
                  type="text"
                  className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                  placeholder="e.g. Blue Dell Laptop Charger or Black Leather Wallet"
                  value={form.title}
                  onChange={handleChange}
                />

                {errors.title && (
                  <div className="invalid-feedback">
                    {errors.title}
                  </div>
                )}
              </div>

              {/* Category, Location and Date */}
              <div className="row g-3 mb-3">

                <div className="col-md-4">
                  <label htmlFor="report-category" className="form-label">
                    Category
                  </label>

                  <select
                    id="report-category"
                    name="category_id"
                    className={`form-select ${errors.category_id ? 'is-invalid' : ''}`}
                    value={form.category_id}
                    onChange={handleChange}
                    disabled={loadingOptions}
                  >
                    <option value="">
                      {loadingOptions ? 'Loading...' : 'Select category'}
                    </option>

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
                  <label htmlFor="report-location" className="form-label">
                    Campus Location
                  </label>

                  <select
                    id="report-location"
                    name="location_id"
                    className={`form-select ${errors.location_id ? 'is-invalid' : ''}`}
                    value={form.location_id}
                    onChange={handleChange}
                    disabled={loadingOptions}
                  >
                    <option value="">
                      {loadingOptions ? 'Loading...' : 'Select location'}
                    </option>

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

                <div className="col-md-4">
                  <label htmlFor="report-date" className="form-label">
                    Date {form.type === 'lost' ? 'Lost' : 'Found'}
                  </label>

                  <input
                    id="report-date"
                    name="date"
                    type="date"
                    max={getTodayDateString()}
                    className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                    value={form.date}
                    onChange={handleChange}
                  />

                  {errors.date && (
                    <div className="invalid-feedback">
                      {errors.date}
                    </div>
                  )}
                </div>

              </div>

              {/* Description */}
              <div className="mb-3">
                <label htmlFor="report-description" className="form-label">
                  Description &amp; Identifying Notes
                </label>

                <textarea
                  id="report-description"
                  name="description"
                  rows={4}
                  className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                  placeholder="Include color, brand, approximate time, or unique marks (for found items, withhold one minor detail to verify claimants)."
                  value={form.description}
                  onChange={handleChange}
                />

                {errors.description && (
                  <div className="invalid-feedback">
                    {errors.description}
                  </div>
                )}
              </div>

              {/* Image Upload */}
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

                <small className="text-muted">
                  Photos are securely uploaded to Supabase Storage.
                </small>
              </div>

              {/* Buttons */}
              <div className="d-flex justify-content-end gap-2">

                <Link to="/" className="btn btn-campus-outline">
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="btn btn-campus-primary"
                  disabled={submitting || loadingOptions}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                      {form.image ? 'Uploading & Submitting...' : 'Submitting...'}
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </button>

              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}