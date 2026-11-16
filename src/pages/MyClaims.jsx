/**
 * src/pages/MyClaims.jsx
 * Card-style claim rows:
 * Section A displays item thumbnail + title + type + proof + date + status.
 * Section B displays incoming claims with claimant initials avatar + green/red Approve/Reject.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAll, approveClaim, rejectClaim } from '../services/db.js';
import { useAuth, assertCanResolveClaim } from '../utils/auth.js';
import { formatDisplayDate } from '../utils/validation.js';
import { useToast } from '../components/Toast.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import CategoryArt from '../components/CategoryArt.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { getInitials } from '../components/Navbar.jsx';

export default function MyClaims() {
  const { user } = useAuth();
  const toast = useToast();

  const [claims, setClaims] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadData = useCallback(() => {
    setClaims(getAll('claims').sort((a, b) => b.claim_id - a.claim_id));
    setItems(getAll('items'));
    setUsers(getAll('users'));
    setCategories(getAll('categories'));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const itemMap = useMemo(() => {
    const map = {};
    items.forEach((i) => {
      map[i.item_id] = i;
    });
    return map;
  }, [items]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.user_id] = u;
    });
    return map;
  }, [users]);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.category_id] = c.category_name;
    });
    return map;
  }, [categories]);

  const mySubmittedClaims = useMemo(() => {
    if (!user) return [];
    return claims.filter((c) => Number(c.user_id) === Number(user.user_id));
  }, [claims, user]);

  const incomingClaims = useMemo(() => {
    if (!user) return [];
    return claims.filter((c) => {
      const parentItem = itemMap[c.item_id];
      return parentItem && Number(parentItem.user_id) === Number(user.user_id);
    });
  }, [claims, itemMap, user]);

  const handleApprove = (claim) => {
    try {
      const parentItem = itemMap[claim.item_id];
      assertCanResolveClaim(user, parentItem);
      const result = approveClaim(claim.claim_id);
      const extraNote =
        result.autoRejectedCount > 0
          ? ` (${result.autoRejectedCount} other pending claim(s) auto-rejected.)`
          : '';
      toast.success(
        `Claim approved! "${parentItem.title}" is now Claimed.${extraNote}`
      );
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = (claim) => {
    try {
      const parentItem = itemMap[claim.item_id];
      assertCanResolveClaim(user, parentItem);
      rejectClaim(claim.claim_id);
      toast.info('Claim rejected. The item remains Open.');
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="container py-4 py-md-5 page-fade">
      <div className="mb-4">
        <h1 className="h3 mb-1">My Claims</h1>
        <p className="text-muted-campus small mb-0">
          Track claims you submitted on found items and verify incoming ownership requests on your items.
        </p>
      </div>

      {/* Section A: My Submitted Claims */}
      <section className="mb-5" aria-labelledby="submitted-claims-heading">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 id="submitted-claims-heading" className="h5 mb-0">
            A. My Submitted Claims
          </h2>
          <span className="small text-muted-campus tabular-nums">
            {mySubmittedClaims.length} record(s)
          </span>
        </div>

        {mySubmittedClaims.length === 0 ? (
          <EmptyState
            title="No submitted claims yet"
            message="When you spot a found item that belongs to you, submit proof of ownership on its details page."
            action={
              <Link to="/" className="btn btn-campus-outline">
                Browse Found Items
              </Link>
            }
          />
        ) : (
          <div className="d-flex flex-column gap-3">
            {mySubmittedClaims.map((claim, idx) => {
              const item = itemMap[claim.item_id];
              const catName = item ? categoryMap[item.category_id] : '';
              return (
                <div
                  key={claim.claim_id}
                  className="campus-card p-3 p-md-4 card-fade-up"
                  style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
                >
                  <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                    <div className="d-flex align-items-start gap-3 flex-grow-1">
                      <CategoryArt
                        image={item?.image}
                        title={item?.title}
                        categoryName={catName}
                        variant="thumb"
                      />
                      <div className="flex-grow-1">
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                          {item ? (
                            <Link
                              to={`/items/${item.item_id}`}
                              className="fw-bold text-decoration-none"
                              style={{ color: 'var(--navy)' }}
                            >
                              {item.title}
                            </Link>
                          ) : (
                            <span className="text-muted-campus fw-semibold">Removed Item</span>
                          )}
                          {item && <StatusBadge value={item.type} />}
                          <StatusBadge value={claim.status} />
                        </div>
                        <p className="small text-muted-campus mb-2">
                          <strong className="text-dark">Proof:</strong> {claim.proof_description}
                        </p>
                        <div className="small text-muted-campus tabular-nums">
                          <i className="bi bi-calendar3 me-1" aria-hidden="true" />
                          Submitted {formatDisplayDate(claim.created_at)}
                        </div>
                      </div>
                    </div>

                    {item && (
                      <Link
                        to={`/items/${item.item_id}`}
                        className="btn btn-sm btn-campus-outline flex-shrink-0"
                      >
                        View Item
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section B: Incoming Claims on My Items */}
      <section aria-labelledby="incoming-claims-heading">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h2 id="incoming-claims-heading" className="h5 mb-0">
            B. Incoming Claims on My Items
          </h2>
          <span className="small text-muted-campus tabular-nums">
            {incomingClaims.length} record(s)
          </span>
        </div>

        {incomingClaims.length === 0 ? (
          <EmptyState
            title="No incoming claims yet"
            message="Ownership claims submitted by other campus members on your Found items will appear here for review."
          />
        ) : (
          <div className="d-flex flex-column gap-3">
            {incomingClaims.map((claim, idx) => {
              const item = itemMap[claim.item_id];
              const claimant = userMap[claim.user_id];
              const isPending = claim.status === 'Pending';

              return (
                <div
                  key={claim.claim_id}
                  className="campus-card p-3 p-md-4 card-fade-up"
                  style={{ animationDelay: `${Math.min(idx * 40, 200)}ms` }}
                >
                  <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                    <div className="d-flex align-items-start gap-3 flex-grow-1">
                      <span className="avatar-circle" aria-hidden="true">
                        {getInitials(claimant?.name)}
                      </span>
                      <div className="flex-grow-1">
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                          <span className="fw-bold" style={{ color: 'var(--navy)' }}>
                            {claimant?.name || 'Unknown Claimant'}
                          </span>
                          <span className="small text-muted-campus">
                            ({claimant?.email || '—'})
                          </span>
                          <StatusBadge value={claim.status} />
                        </div>

                        {item && (
                          <div className="small mb-2 d-flex flex-wrap align-items-center gap-2">
                            <span className="text-muted-campus">Claimed item:</span>
                            <Link
                              to={`/items/${item.item_id}`}
                              className="fw-semibold text-decoration-none"
                            >
                              {item.title}
                            </Link>
                            <StatusBadge value={item.status} />
                          </div>
                        )}

                        <p className="small mb-2" style={{ color: 'var(--text)' }}>
                          <strong>Proof submitted:</strong> {claim.proof_description}
                        </p>

                        <div className="small text-muted-campus tabular-nums">
                          <i className="bi bi-calendar3 me-1" aria-hidden="true" />
                          {formatDisplayDate(claim.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-success btn-sm px-3"
                            style={{ minHeight: '38px', borderRadius: '8px' }}
                            onClick={() => handleApprove(claim)}
                          >
                            <i className="bi bi-check-lg me-1" aria-hidden="true" />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm px-3"
                            style={{ minHeight: '38px', borderRadius: '8px' }}
                            onClick={() => handleReject(claim)}
                          >
                            <i className="bi bi-x-lg me-1" aria-hidden="true" />
                            Reject
                          </button>
                        </>
                      ) : claim.status === 'Approved' && item?.status === 'Claimed' ? (
                        <Link to="/my-items" className="btn btn-sm btn-campus-outline">
                          Go to My Items to Return
                        </Link>
                      ) : (
                        <span className="small text-muted-campus fw-medium">Resolved</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
