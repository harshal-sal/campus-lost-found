/**
 * src/components/Footer.jsx
 * Dark navy campus footer with project metadata and team member credits.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/auth.js';

export default function Footer() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <footer className="campus-footer py-4 mt-5">
      <div className="container">
        <div className="row gy-3 align-items-center">
          <div className="col-12 col-lg-5">
            <div className="d-flex align-items-center gap-2 text-white fw-semibold mb-1">
              <i className="bi bi-compass-fill" style={{ color: 'var(--sky)' }} aria-hidden="true" />
              <span>CampusFind · Campus Lost and Found System</span>
            </div>
            <div className="small opacity-75">
              DBMS Lab Mini Project | Semester V | 2026-27
            </div>
          </div>

          <div className="col-12 col-lg-4 text-lg-center">
            <div className="small">
              <span className="opacity-75 me-1">Developed by</span>
              <span className="text-white fw-medium">Harshal Salunke 24CE227</span>
              <span className="mx-2 opacity-50" aria-hidden="true">·</span>
              <span className="text-white fw-medium">Diya Jambhale 24CE220</span>
            </div>
          </div>

          <div className="col-12 col-lg-3 d-flex flex-wrap justify-content-lg-end gap-3 small">
            {isAuthenticated ? (
              <>
                <Link to="/">Browse</Link>
                <Link to="/report">Report</Link>
                <Link to="/my-claims">Claims</Link>
                {isAdmin && <Link to="/admin">Admin</Link>}
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
