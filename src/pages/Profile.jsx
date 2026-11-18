import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';
import { useAuth } from '../utils/auth.js';
import { validateProfileForm, formatDisplayDate } from '../utils/validation.js';
import { useToast } from '../components/Toast.jsx';
import { getInitials } from '../components/Navbar.jsx';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [activity, setActivity] = useState({
    items: 0,
    claims: 0,
  });

  // Load profile information and activity statistics
  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
    });

    const loadActivity = async () => {
      setLoadingActivity(true);

      try {
        const [itemsResult, claimsResult] = await Promise.all([
          supabase
            .from('items')
            .select('item_id', { count: 'exact', head: true })
            .eq('user_id', user.user_id),

          supabase
            .from('claims')
            .select('claim_id', { count: 'exact', head: true })
            .eq('user_id', user.user_id),
        ]);

        if (itemsResult.error) throw itemsResult.error;
        if (claimsResult.error) throw claimsResult.error;

        setActivity({
          items: itemsResult.count || 0,
          claims: claimsResult.count || 0,
        });
      } catch (error) {
        console.error('Activity loading error:', error);
        toast.error('Unable to load your activity statistics.');
      } finally {
        setLoadingActivity(false);
      }
    };

    loadActivity();
  }, [user]);

  // Handle form input changes
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

  // Update profile
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateProfileForm(form);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password || undefined,
      });

      setForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));

      toast.success('Profile update request completed successfully.');
    } catch (err) {
      console.error('Profile update error:', err);

      toast.error(err.message || 'Unable to update your profile.');

      if (err.message?.toLowerCase().includes('email')) {
        setErrors((prev) => ({
          ...prev,
          email: err.message,
        }));
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container py-4 py-md-5 page-fade">
      <div className="row g-4">

        {/* Account Overview */}
        <div className="col-12 col-lg-4">
          <div className="campus-card p-4 h-100">

            <div className="d-flex align-items-center gap-3 mb-4">
              <span className="avatar-circle avatar-circle-lg" aria-hidden="true">
                {getInitials(user.name)}
              </span>

              <div>
                <h1 className="h5 mb-1">{user.name}</h1>

                <span className="status-badge status-badge-open text-capitalize">
                  <i className="bi bi-person-badge" aria-hidden="true" />
                  <span>{user.role}</span>
                </span>
              </div>
            </div>

            <div className="d-flex flex-column gap-3 small">

              <div>
                <div className="text-muted-campus">User ID</div>
                <div className="fw-semibold font-mono-id">
                  #{user.user_id}
                </div>
              </div>

              <div>
                <div className="text-muted-campus">Email</div>
                <div className="fw-semibold">{user.email}</div>
              </div>

              <div>
                <div className="text-muted-campus">Member Since</div>
                <div className="fw-semibold tabular-nums">
                  {formatDisplayDate(user.created_at)}
                </div>
              </div>

              <div
                className="pt-3 border-top d-flex justify-content-between tabular-nums"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-muted-campus">Items Reported</span>
                <strong>
                  {loadingActivity ? '...' : activity.items}
                </strong>
              </div>

              <div className="d-flex justify-content-between tabular-nums">
                <span className="text-muted-campus">Claims Submitted</span>
                <strong>
                  {loadingActivity ? '...' : activity.claims}
                </strong>
              </div>

            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className="col-12 col-lg-8">
          <div className="campus-card p-4 p-md-5">

            <h2 className="h4 mb-1">Edit Profile</h2>

            <p className="text-muted-campus small mb-4">
              Update your display name, unique campus email, or set a new password.
            </p>

            <form onSubmit={handleSubmit} noValidate>

              {/* Full Name */}
              <div className="mb-3">
                <label htmlFor="profile-name" className="form-label">
                  Full Name
                </label>

                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  value={form.name}
                  onChange={handleChange}
                />

                {errors.name && (
                  <div className="invalid-feedback">{errors.name}</div>
                )}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label htmlFor="profile-email" className="form-label">
                  Campus Email
                </label>

                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  value={form.email}
                  onChange={handleChange}
                />

                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>

              {/* Password Fields */}
              <div className="row g-3 mb-4">

                <div className="col-md-6">
                  <label htmlFor="profile-password" className="form-label">
                    New Password (optional)
                  </label>

                  <div className="input-group">
                    <input
                      id="profile-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Leave blank to keep current"
                      value={form.password}
                      onChange={handleChange}
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      style={{ borderColor: 'var(--border)' }}
                      aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <i
                        className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}
                        aria-hidden="true"
                      />
                    </button>

                    {errors.password && (
                      <div className="invalid-feedback">
                        {errors.password}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <label htmlFor="profile-confirm" className="form-label">
                    Confirm New Password
                  </label>

                  <div className="input-group">
                    <input
                      id="profile-confirm"
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      placeholder="Re-enter new password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      style={{ borderColor: 'var(--border)' }}
                      aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                      onClick={() => setShowConfirm((prev) => !prev)}
                    >
                      <i
                        className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`}
                        aria-hidden="true"
                      />
                    </button>

                    {errors.confirmPassword && (
                      <div className="invalid-feedback">
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-campus-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    />
                    Saving...
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}