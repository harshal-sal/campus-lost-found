/**
 * src/components/ItemCard.jsx
 * Responsive card with top photo/category tile, overlaid Type badge, 2-line description,
 * icon metadata row, Status badge, and View Details CTA.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import CategoryArt from './CategoryArt.jsx';
import { formatDisplayDate } from '../utils/validation.js';

export default function ItemCard({ item, categoryName, locationName, index = 0 }) {
  return (
    <article
      className="campus-card campus-card-hover h-100 d-flex flex-column overflow-hidden card-fade-up"
      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
    >
      <CategoryArt image={item.image} title={item.title} categoryName={categoryName} variant="card">
        <div className="item-card-type-overlay">
          <StatusBadge value={item.type} />
        </div>
      </CategoryArt>

      <div className="p-3 p-md-4 d-flex flex-column flex-grow-1">
        <h3 className="h6 mb-2 fw-bold" style={{ color: 'var(--navy)' }}>
          {item.title}
        </h3>

        <p
          className="text-muted-campus line-clamp-2 mb-3 flex-grow-1"
          style={{ fontSize: '0.86rem' }}
        >
          {item.description}
        </p>

        <div
          className="d-flex flex-wrap align-items-center gap-3 text-muted-campus mb-3"
          style={{ fontSize: '0.78rem' }}
        >
          <span className="d-inline-flex align-items-center gap-1">
            <i className="bi bi-tag" aria-hidden="true" />
            <span>{categoryName || 'General'}</span>
          </span>
          <span className="d-inline-flex align-items-center gap-1">
            <i className="bi bi-geo-alt" aria-hidden="true" />
            <span>{locationName || 'Campus'}</span>
          </span>
          <span className="d-inline-flex align-items-center gap-1 tabular-nums">
            <i className="bi bi-calendar3" aria-hidden="true" />
            <span>{formatDisplayDate(item.date)}</span>
          </span>
        </div>

        <div
          className="d-flex align-items-center justify-content-between gap-2 pt-3 border-top"
          style={{ borderColor: 'var(--border)' }}
        >
          <StatusBadge value={item.status} />
          <Link
            to={`/items/${item.item_id}`}
            className="btn btn-sm btn-campus-outline"
            style={{ minHeight: '34px', padding: '0.3rem 0.8rem', fontSize: '0.82rem' }}
          >
            View Details
            <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
