/**
 * src/components/EmptyState.jsx
 * Reusable empty state featuring an inline SVG illustration, message, and optional action.
 */

import React from 'react';
import { EmptyStateIllustration } from './SvgArtwork.jsx';

export default function EmptyState({ title, message, action }) {
  return (
    <div className="campus-empty-state">
      <EmptyStateIllustration />
      <h2 className="h5 mb-2">{title}</h2>
      <p className="text-muted-campus small mb-4 mx-auto" style={{ maxWidth: '420px' }}>
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
