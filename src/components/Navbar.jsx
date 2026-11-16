/**
 * src/components/Navbar.jsx
 * Sticky navy CampusFind navigation bar with role-aware icon links,
 * React-controlled user initials dropdown, and mobile hamburger menu.
 */

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/auth.js';
import { useToast } from './Toast.jsx';

export function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    toast.info('You have been logged out.');
    navigate('/login');
  };

  const closeAll = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
  };

  const initials = getInitials(user?.name);

  return (
    <header className="campus-navbar sticky-top">
      <div className="container py-2">
        <div className="d-flex align-items-center justify-content-between gap-3">
          {/* Brand */}
          <Link
            to={isAuthenticated ? '/' : '/login'}
            className="campus-brand d-flex align-items-center gap-2"
            onClick={closeAll}
          >
            <span className="campus-brand-badge" aria-hidden="true">
              <i className="bi bi-compass-fill" />
            </span>
            <span>CampusFind</span>
          </Link>

          {/* Mobile Hamburger */}
          <button
            type="button"
            className="btn btn-sm d-lg-none text-white border border-light border-opacity-25"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            style={{ minHeight: '40px', minWidth: '44px' }}
          >
            <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'} fs-5`} aria-hidden="true" />
          </button>

          {/* Desktop Role-Aware Links */}
          <nav className="d-none d-lg-flex align-items-center gap-1" aria-label="Primary navigation">
            {isAuthenticated ? (
              <>
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-grid" aria-hidden="true" />
                  <span>Browse</span>
                </NavLink>
                <NavLink
                  to="/report"
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-plus-circle" aria-hidden="true" />
                  <span>Report Item</span>
                </NavLink>
                <NavLink
                  to="/my-items"
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-box-seam" aria-hidden="true" />
                  <span>My Items</span>
                </NavLink>
                <NavLink
                  to="/my-claims"
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-clipboard-check" aria-hidden="true" />
                  <span>My Claims</span>
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <i className="bi bi-shield-lock" aria-hidden="true" />
                    <span>Admin</span>
                  </NavLink>
                )}
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                  <span>Login</span>
                </NavLink>
                <NavLink
                  to="/register"
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-person-plus" aria-hidden="true" />
                  <span>Register</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Desktop Right Zone: User Dropdown or Register CTA */}
          <div className="d-none d-lg-flex align-items-center flex-shrink-0">
            {isAuthenticated ? (
              <div className="user-dropdown-wrapper" ref={dropdownRef}>
                <button
                  type="button"
                  className="user-dropdown-trigger"
                  aria-expanded={dropdownOpen}
                  aria-haspopup="menu"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  <span className="avatar-circle avatar-circle-sm" aria-hidden="true">
                    {initials}
                  </span>
                  <span className="text-truncate" style={{ maxWidth: '140px' }}>
                    {user.name}
                  </span>
                  <i
                    className={`bi ${dropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'} small opacity-75`}
                    aria-hidden="true"
                  />
                </button>

                {dropdownOpen && (
                  <div className="user-dropdown-menu" role="menu">
                    <div className="px-3 py-2 border-bottom mb-1" style={{ borderColor: 'var(--border)' }}>
                      <div className="fw-semibold small" style={{ color: 'var(--navy)' }}>
                        {user.name}
                      </div>
                      <div className="small text-muted-campus text-capitalize">
                        {user.role} · {user.email}
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      role="menuitem"
                      className="user-dropdown-item"
                      onClick={closeAll}
                    >
                      <i className="bi bi-person-circle" aria-hidden="true" />
                      <span>Profile Settings</span>
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="user-dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right" aria-hidden="true" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/register"
                className="btn btn-sm btn-campus-amber"
                style={{ minHeight: '38px', padding: '0.4rem 1rem' }}
              >
                Get Started
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Collapsible Menu */}
        {menuOpen && (
          <nav
            className="d-lg-none mt-3 pt-3 border-top border-light border-opacity-25 d-flex flex-column gap-1"
            aria-label="Mobile navigation"
          >
            {isAuthenticated ? (
              <>
                <div className="d-flex align-items-center gap-2 px-2 py-2 mb-1 text-white">
                  <span className="avatar-circle avatar-circle-sm" aria-hidden="true">
                    {initials}
                  </span>
                  <div className="small">
                    <div className="fw-semibold">{user.name}</div>
                    <div className="opacity-75 text-capitalize">{user.role}</div>
                  </div>
                </div>
                <NavLink
                  to="/"
                  end
                  onClick={closeAll}
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-grid" aria-hidden="true" />
                  <span>Browse</span>
                </NavLink>
                <NavLink
                  to="/report"
                  onClick={closeAll}
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-plus-circle" aria-hidden="true" />
                  <span>Report Item</span>
                </NavLink>
                <NavLink
                  to="/my-items"
                  onClick={closeAll}
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-box-seam" aria-hidden="true" />
                  <span>My Items</span>
                </NavLink>
                <NavLink
                  to="/my-claims"
                  onClick={closeAll}
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-clipboard-check" aria-hidden="true" />
                  <span>My Claims</span>
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={closeAll}
                    className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <i className="bi bi-shield-lock" aria-hidden="true" />
                    <span>Admin Dashboard</span>
                  </NavLink>
                )}
                <NavLink
                  to="/profile"
                  onClick={closeAll}
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-person-circle" aria-hidden="true" />
                  <span>Profile</span>
                </NavLink>
                <button
                  type="button"
                  className="btn btn-sm btn-campus-amber mt-2 align-self-start"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-1" aria-hidden="true" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  onClick={closeAll}
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                  <span>Login</span>
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={closeAll}
                  className={({ isActive }) => `campus-nav-link ${isActive ? 'active' : ''}`}
                >
                  <i className="bi bi-person-plus" aria-hidden="true" />
                  <span>Register</span>
                </NavLink>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
