/**
 * src/pages/Login.jsx
 * Split-layout Sign In page with navy SVG illustration panel and password visibility toggle.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/auth.js';
import { validateLoginForm } from '../utils/validation.js';
import { useToast } from '../components/Toast.jsx';
import { AuthIllustration } from '../components/SvgArtwork.jsx';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateLoginForm({ email, password });
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const loggedIn = login(email, password);
      toast.success(`Welcome back, ${loggedIn.name}!`);
      const destination = location.state?.from || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrors({});
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
                  Reuniting lost belongings across campus
                </h2>
                <p className="small opacity-75 mb-4">
                  A verified directory for students, faculty, and campus administrators.
                </p>

                <div className="text-center my-3">
                  <AuthIllustration />
                </div>
              </div>

              <ul className="list-unstyled small mb-0 d-flex flex-column gap-2 mt-3">
                <li className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill" style={{ color: 'var(--sky)' }} aria-hidden="true" />
                  <span>Post lost or found reports with compressed photos</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill" style={{ color: 'var(--sky)' }} aria-hidden="true" />
                  <span>Verify ownership through structured proof claims</span>
                </li>
                <li className="d-flex align-items-center gap-2">
                  <i className="bi bi-check-circle-fill" style={{ color: 'var(--sky)' }} aria-hidden="true" />
                  <span>Track status from Open to Claimed to Returned</span>
                </li>
              </ul>
            </div>

            {/* Right Form Panel */}
            <div className="col-12 col-lg-7 p-4 p-md-5 bg-white">
              <div className="mb-4">
                <h1 className="h3 mb-1">Sign In to CampusFind</h1>
                <p className="text-muted-campus small mb-0">
                  Enter your campus email and password to access the lost &amp; found board.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="login-email" className="form-label">
                    Campus Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    placeholder="student@campus.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((p) => ({ ...p, email: '' }));
                    }}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                <div className="mb-4">
                  <label htmlFor="login-password" className="form-label">
                    Password
                  </label>
                  <div className="input-group">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((p) => ({ ...p, password: '' }));
                      }}
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

                <button
                  type="submit"
                  className="btn btn-campus-primary w-100 mb-3"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <div className="text-center small text-muted-campus mb-4">
                New to CampusFind?{' '}
                <Link to="/register" className="fw-semibold text-decoration-none">
                  Create an account
                </Link>
              </div>

              <div className="pt-3 border-top" style={{ borderColor: 'var(--border)' }}>
                <div className="small fw-semibold mb-2" style={{ color: 'var(--navy)' }}>
                  Demo Credentials (Quick Fill)
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-campus-outline"
                    onClick={() => fillDemo('student@campus.com', 'student123')}
                  >
                    Student Demo
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-campus-outline"
                    onClick={() => fillDemo('faculty@campus.com', 'faculty123')}
                  >
                    Faculty Demo
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-campus-outline"
                    onClick={() => fillDemo('admin@campus.com', 'admin123')}
                  >
                    Admin Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
