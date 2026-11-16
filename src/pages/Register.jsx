/**
 * src/pages/Register.jsx
 * Split-layout registration page (Student or Faculty only) with password toggles.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth.js';
import { validateRegisterForm } from '../utils/validation.js';
import { useToast } from '../components/Toast.jsx';
import { AuthIllustration } from '../components/SvgArtwork.jsx';

export default function Register() {
  const { isAuthenticated, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateRegisterForm(form);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const created = register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      toast.success('Registration successful! Please log in with your credentials.');
      navigate('/login', { state: { email: created.email } });
    } catch (err) {
      toast.error(err.message);
      if (err.message.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: err.message }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4 py-md-5 page-fade">
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          <div className="auth-split-card row g-0">
            {/* Left Illustration Panel */}
            <div className="col-12 col-lg-5 auth-illustration-panel">
              <div>
                <div className="d-inline-flex align-items-center gap-2 mb-3">
                  <span className="campus-brand-badge">
                    <i className="bi bi-compass-fill" aria-hidden="true" />
                  </span>
                  <span className="fw-bold fs-5">CampusFind</span>
                </div>
                <h2 className="h4 text-white mb-2">
                  Join the campus recovery network
                </h2>
                <p className="small opacity-75 mb-4">
                  Register as a Student or Faculty member in seconds.
                </p>

                <div className="text-center my-3">
                  <AuthIllustration />
                </div>
              </div>

              <ul className="list-unstyled small mb-0 d-flex flex-column gap-2 mt-3">
                <li className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill" style={{ color: 'var(--sky)' }} aria-hidden="true" />
                  <span>Instant campus-wide search by location &amp; category</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill" style={{ color: 'var(--sky)' }} aria-hidden="true" />
                  <span>Manage your posted items and incoming claims</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill" style={{ color: 'var(--sky)' }} aria-hidden="true" />
                  <span>Automatic email uniqueness &amp; data integrity checks</span>
                </li>
              </ul>
            </div>

            {/* Right Form Panel */}
            <div className="col-12 col-lg-7 p-4 p-md-5 bg-white">
              <div className="mb-4">
                <h1 className="h3 mb-1">Create Campus Account</h1>
                <p className="text-muted-campus small mb-0">
                  Register as a Student or Faculty member to report or claim items.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="reg-name" className="form-label">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    name="name"
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Diya Jambhale"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-7">
                    <label htmlFor="reg-email" className="form-label">
                      Campus Email
                    </label>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      placeholder="name@campus.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>

                  <div className="col-md-5">
                    <label htmlFor="reg-role" className="form-label">
                      Campus Role
                    </label>
                    <select
                      id="reg-role"
                      name="role"
                      className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                      value={form.role}
                      onChange={handleChange}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                    </select>
                    {errors.role && <div className="invalid-feedback">{errors.role}</div>}
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label htmlFor="reg-password" className="form-label">
                      Password
                    </label>
                    <div className="input-group">
                      <input
                        id="reg-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        style={{ borderColor: 'var(--border)' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                      </button>
                      {errors.password && (
                        <div className="invalid-feedback">{errors.password}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="reg-confirm" className="form-label">
                      Confirm Password
                    </label>
                    <div className="input-group">
                      <input
                        id="reg-confirm"
                        name="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                        placeholder="Re-enter password"
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
                        <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                      </button>
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-campus-primary w-100 mb-3"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Creating account...
                    </>
                  ) : (
                    'Register Account'
                  )}
                </button>
              </form>

              <div className="text-center small text-muted-campus">
                Already have an account?{' '}
                <Link to="/login" className="fw-semibold text-decoration-none">
                  Sign in here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
