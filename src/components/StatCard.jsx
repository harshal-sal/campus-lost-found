/**
 * src/components/StatCard.jsx
 * Reusable stat card with gradient top accent and icon badge for the Admin Dashboard.
 */

import React from 'react';

export default function StatCard({ label, value, icon, gradient, iconBg, iconColor }) {
  return (
    <div className="admin-stat-card h-100">
      <div className="admin-stat-accent" style={{ background: gradient }} />
      <div className="d-flex align-items-center justify-content-between gap-2 mt-1">
        <div>
          <div className="small text-muted-campus fw-medium">{label}</div>
          <div className="fs-3 fw-bold tabular-nums" style={{ color: 'var(--navy)' }}>
            {value}
          </div>
        </div>
        <div
          className="stat-icon-box"
          style={{
            backgroundColor: iconBg,
            color: iconColor,
            width: '42px',
            height: '42px',
            fontSize: '1.15rem',
          }}
        >
          <i className={`bi ${icon}`} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
