/**
 * src/pages/Home.jsx
 * Home / Browse page featuring gradient Hero with inline SVG & search bar,
 * animated count-up stats strip, category/location/type/status filters,
 * skeleton placeholders while loading, ItemCard grid, and SVG EmptyState.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAll } from '../services/db.js';
import ItemCard from '../components/ItemCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { HeroIllustration } from '../components/SvgArtwork.jsx';

function useCountUp(target, duration = 600) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const goal = Number(target) || 0;
    if (goal === 0) {
      setCount(0);
      return undefined;
    }
    let rafId;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * goal));
      if (progress < 1) {
        rafId = window.requestAnimationFrame(step);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [target, duration]);

  return count;
}

function SkeletonCard() {
  return (
    <div className="campus-card overflow-hidden h-100">
      <div className="skeleton-box" style={{ height: '180px', borderRadius: 0 }} />
      <div className="p-4">
        <div className="skeleton-box mb-2" style={{ height: '20px', width: '75%' }} />
        <div className="skeleton-box mb-2" style={{ height: '14px', width: '100%' }} />
        <div className="skeleton-box mb-3" style={{ height: '14px', width: '60%' }} />
        <div className="d-flex justify-content-between pt-3 border-top">
          <div className="skeleton-box" style={{ height: '26px', width: '78px', borderRadius: '999px' }} />
          <div className="skeleton-box" style={{ height: '32px', width: '110px' }} />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const loadedItems = getAll('items').sort((a, b) => b.item_id - a.item_id);
    setItems(loadedItems);
    setCategories(getAll('categories'));
    setLocations(getAll('locations'));
    setClaims(getAll('claims'));

    const timer = window.setTimeout(() => {
      setLoading(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, []);

  const totalReported = items.length;
  const totalReturned = items.filter((i) => i.status === 'Returned').length;
  const activeClaims = claims.filter((c) => c.status === 'Pending').length;

  const animatedReported = useCountUp(totalReported);
  const animatedReturned = useCountUp(totalReturned);
  const animatedClaims = useCountUp(activeClaims);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.category_id] = c.category_name;
    });
    return map;
  }, [categories]);

  const locationMap = useMemo(() => {
    const map = {};
    locations.forEach((l) => {
      map[l.location_id] = l.location_name;
    });
    return map;
  }, [locations]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const titleMatch = item.title.toLowerCase().includes(q);
        const descMatch = item.description.toLowerCase().includes(q);
        if (!titleMatch && !descMatch) return false;
      }
      if (categoryFilter && Number(item.category_id) !== Number(categoryFilter)) {
        return false;
      }
      if (locationFilter && Number(item.location_id) !== Number(locationFilter)) {
        return false;
      }
      if (typeFilter && item.type !== typeFilter) {
        return false;
      }
      if (statusFilter && item.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [items, search, categoryFilter, locationFilter, typeFilter, statusFilter]);

  const hasActiveFilters = Boolean(
    search || categoryFilter || locationFilter || typeFilter || statusFilter
  );

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setLocationFilter('');
    setTypeFilter('');
    setStatusFilter('');
  };

  return (
    <div className="page-fade">
      {/* Hero Banner */}
      <section className="campus-hero">
        <div className="campus-hero-shape campus-hero-shape-1" aria-hidden="true" />
        <div className="campus-hero-shape campus-hero-shape-2" aria-hidden="true" />

        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-7">
              <h1 className="display-6 fw-bold text-white mb-3">
                Lost something? Found something? Reunite it on campus.
              </h1>
              <p className="mb-4 opacity-90" style={{ fontSize: '1rem', maxWidth: '560px' }}>
                Browse verified reports across lecture halls, libraries, hostels, and parking
                zones, or submit a report in under a minute.
              </p>

              {/* Prominent Hero Search Bar */}
              <div className="campus-hero-search d-flex align-items-center gap-2 mb-4">
                <i
                  className="bi bi-search ms-2"
                  style={{ color: 'var(--muted)' }}
                  aria-hidden="true"
                />
                <input
                  type="text"
                  aria-label="Search lost and found items"
                  className="form-control"
                  placeholder="Search by item name, brand, or description (e.g. AirPods, keys)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    className="btn btn-sm text-muted-campus"
                    aria-label="Clear search"
                    onClick={() => setSearch('')}
                  >
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Dual Report CTAs */}
              <div className="d-flex flex-wrap gap-3">
                <Link to="/report?type=lost" className="btn btn-campus-amber">
                  <i className="bi bi-search me-2" aria-hidden="true" />
                  Report Lost Item
                </Link>
                <Link
                  to="/report?type=found"
                  className="btn btn-light fw-semibold"
                  style={{
                    color: 'var(--navy)',
                    borderRadius: '10px',
                    minHeight: '42px',
                    padding: '0.5rem 1.2rem',
                  }}
                >
                  <i className="bi bi-box-seam me-2" aria-hidden="true" />
                  Report Found Item
                </Link>
              </div>
            </div>

            <div className="col-12 col-lg-5 d-flex justify-content-center justify-content-lg-end">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Animated Stats Strip */}
      <div className="container stats-strip-wrapper mb-4">
        <div className="stats-strip-card">
          <div className="row g-3 text-center text-md-start">
            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3">
                <div
                  className="stat-icon-box"
                  style={{ backgroundColor: 'var(--ice)', color: 'var(--royal)' }}
                >
                  <i className="bi bi-box-seam" aria-hidden="true" />
                </div>
                <div>
                  <div className="fs-4 fw-bold tabular-nums" style={{ color: 'var(--navy)' }}>
                    {animatedReported}
                  </div>
                  <div className="small text-muted-campus">Items Reported</div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3">
                <div
                  className="stat-icon-box"
                  style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}
                >
                  <i className="bi bi-check2-circle" aria-hidden="true" />
                </div>
                <div>
                  <div className="fs-4 fw-bold tabular-nums" style={{ color: 'var(--navy)' }}>
                    {animatedReturned}
                  </div>
                  <div className="small text-muted-campus">Items Returned</div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-3">
                <div
                  className="stat-icon-box"
                  style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}
                >
                  <i className="bi bi-clock-history" aria-hidden="true" />
                </div>
                <div>
                  <div className="fs-4 fw-bold tabular-nums" style={{ color: 'var(--navy)' }}>
                    {animatedClaims}
                  </div>
                  <div className="small text-muted-campus">Active Claims</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Results Grid */}
      <div className="container pb-4">
        <section className="campus-card p-3 p-md-4 mb-4" aria-label="Filter items">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-3">
              <label htmlFor="filter-category" className="form-label">
                Category
              </label>
              <select
                id="filter-category"
                className="form-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.category_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-3">
              <label htmlFor="filter-location" className="form-label">
                Location
              </label>
              <select
                id="filter-location"
                className="form-select"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="">All Locations</option>
                {locations.map((l) => (
                  <option key={l.location_id} value={l.location_id}>
                    {l.location_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label htmlFor="filter-type" className="form-label">
                Type
              </label>
              <select
                id="filter-type"
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>

            <div className="col-6 col-md-2">
              <label htmlFor="filter-status" className="form-label">
                Status
              </label>
              <select
                id="filter-status"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Claimed">Claimed</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <div className="col-12 col-md-2 d-flex justify-content-md-end">
              {hasActiveFilters ? (
                <button
                  type="button"
                  className="btn btn-campus-outline w-100"
                  onClick={clearFilters}
                >
                  <i className="bi bi-x-circle me-1" aria-hidden="true" />
                  Clear
                </button>
              ) : (
                <div className="small text-muted-campus tabular-nums py-2">
                  <strong>{filteredItems.length}</strong> item(s)
                </div>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 pt-2 border-top small text-muted-campus tabular-nums">
              Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong>{' '}
              reported item(s)
            </div>
          )}
        </section>

        {loading ? (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="col">
                <SkeletonCard />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title="No matching items found"
            message={
              hasActiveFilters
                ? 'Try adjusting or clearing your search keywords and filters to view more campus reports.'
                : 'No items have been reported yet. Be the first to post a lost or found report.'
            }
            action={
              <div className="d-flex justify-content-center flex-wrap gap-2">
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-campus-outline"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                )}
                <Link to="/report" className="btn btn-campus-primary">
                  Report an Item
                </Link>
              </div>
            }
          />
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {filteredItems.map((item, idx) => (
              <div key={item.item_id} className="col">
                <ItemCard
                  item={item}
                  categoryName={categoryMap[item.category_id]}
                  locationName={locationMap[item.location_id]}
                  index={idx}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
