/**
 * src/components/StatusBadge.jsx
 * Semantic status & type badges with color + icon + text label.
 */

import React from 'react';

const BADGE_CONFIG = {
  Open: { className: 'status-badge-open', icon: 'bi-record-circle', label: 'Open' },
  Claimed: { className: 'status-badge-claimed', icon: 'bi-hourglass-split', label: 'Claimed' },
  Returned: { className: 'status-badge-returned', icon: 'bi-check-circle', label: 'Returned' },
  Pending: { className: 'status-badge-pending', icon: 'bi-clock', label: 'Pending' },
  Approved: { className: 'status-badge-approved', icon: 'bi-check2-circle', label: 'Approved' },
  Rejected: { className: 'status-badge-rejected', icon: 'bi-x-circle', label: 'Rejected' },
  lost: { className: 'status-badge-lost', icon: 'bi-search', label: 'Lost' },
  found: { className: 'status-badge-found', icon: 'bi-box-seam', label: 'Found' },
};

export default function StatusBadge({ value }) {
  const cfg = BADGE_CONFIG[value] || {
    className: 'status-badge-open',
    icon: 'bi-tag',
    label: String(value || 'Unknown'),
  };

  return (
    <span className={`status-badge ${cfg.className}`}>
      <i className={`bi ${cfg.icon}`} aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
}
