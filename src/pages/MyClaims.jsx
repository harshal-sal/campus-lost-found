import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';

import { supabase } from '../services/supabase.js';
import { useAuth } from '../utils/auth.js';
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

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [processingClaimId, setProcessingClaimId] = useState(null);

  // ==========================================
  // LOAD DATA FROM SUPABASE
  // ==========================================

  const loadData = useCallback(async () => {
    if (!user?.user_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');

    try {
      const [
        claimsResult,
        itemsResult,
        usersResult,
        categoriesResult,
      ] = await Promise.all([
        supabase
          .from('claims')
          .select('*')
          .order('claim_id', { ascending: false }),

        supabase
          .from('items')
          .select('*'),

        supabase
          .from('users')
          .select('user_id, name, role'),

        supabase
          .from('categories')
          .select('*'),
      ]);

      if (claimsResult.error) throw claimsResult.error;
      if (itemsResult.error) throw itemsResult.error;
      if (usersResult.error) throw usersResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      // Generate signed URLs for private item images
      const itemsWithImages = await Promise.all(
        (itemsResult.data || []).map(async (item) => {
          if (!item.image) return item;

          const { data, error } = await supabase.storage
            .from('item-images')
            .createSignedUrl(item.image, 3600);

          if (error) {
            console.error('Image URL error:', error.message);
            return { ...item, image: null };
          }

          return {
            ...item,
            image: data.signedUrl,
          };
        })
      );

      setClaims(claimsResult.data || []);
      setItems(itemsWithImages);
      setUsers(usersResult.data || []);
      setCategories(categoriesResult.data || []);

    } catch (error) {
      console.error('My Claims loading error:', error);

      setLoadError(
        error.message || 'Unable to load claims.'
      );

    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // CREATE LOOKUP MAPS
  // ==========================================

  const itemMap = useMemo(() => {
    const map = {};

    items.forEach((item) => {
      map[item.item_id] = item;
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

    categories.forEach((category) => {
      map[category.category_id] = category.category_name;
    });

    return map;
  }, [categories]);

  // ==========================================
  // MY SUBMITTED CLAIMS
  // ==========================================

  const mySubmittedClaims = useMemo(() => {
    if (!user) return [];

    return claims.filter(
      (claim) =>
        Number(claim.user_id) === Number(user.user_id)
    );
  }, [claims, user]);

  // ==========================================
  // INCOMING CLAIMS ON MY ITEMS
  // ==========================================

  const incomingClaims = useMemo(() => {
    if (!user) return [];

    return claims.filter((claim) => {
      const parentItem = itemMap[claim.item_id];

      return (
        parentItem &&
        Number(parentItem.user_id) === Number(user.user_id)
      );
    });
  }, [claims, itemMap, user]);

  // ==========================================
  // APPROVE CLAIM
  // ==========================================

  const handleApprove = async (claim) => {
    try {
      const parentItem = itemMap[claim.item_id];

      if (!parentItem) {
        throw new Error('Associated item not found.');
      }

      // Verify ownership on frontend
      if (
        Number(parentItem.user_id) !== Number(user?.user_id)
      ) {
        throw new Error(
          'You are not authorized to approve this claim.'
        );
      }

      setProcessingClaimId(claim.claim_id);

      // Call secure PostgreSQL function
      const { data, error } = await supabase.rpc(
        'approve_claim',
        {
          p_claim_id: claim.claim_id,
        }
      );

      if (error) throw error;

      const autoRejectedCount =
        data?.autoRejectedCount || 0;

      const extraNote =
        autoRejectedCount > 0
          ? ` ${autoRejectedCount} other pending claim(s) were automatically rejected.`
          : '';

      toast.success(
        `Claim approved! "${parentItem.title}" is now Claimed.${extraNote}`
      );

      // Refresh claims and item status
      await loadData();

    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error.message);

    } finally {
      setProcessingClaimId(null);
    }
  };

  // ==========================================
  // REJECT CLAIM
  // ==========================================

  const handleReject = async (claim) => {
    try {
      const parentItem = itemMap[claim.item_id];

      if (!parentItem) {
        throw new Error('Associated item not found.');
      }

      // Verify ownership on frontend
      if (
        Number(parentItem.user_id) !== Number(user?.user_id)
      ) {
        throw new Error(
          'You are not authorized to reject this claim.'
        );
      }

      setProcessingClaimId(claim.claim_id);

      // Call secure PostgreSQL function
      const { error } = await supabase.rpc(
        'reject_claim',
        {
          p_claim_id: claim.claim_id,
        }
      );

      if (error) throw error;

      toast.info(
        'Claim rejected. The item remains Open.'
      );

      // Refresh claims and item status
      await loadData();

    } catch (error) {
      console.error('Rejection error:', error);
      toast.error(error.message);

    } finally {
      setProcessingClaimId(null);
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">
            Loading claims...
          </span>
        </div>

        <p className="small text-muted-campus mt-3">
          Loading your claims...
        </p>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (loadError) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <strong>Unable to load claims.</strong>

          <p className="mb-3">
            {loadError}
          </p>

          <button
            type="button"
            className="btn btn-campus-primary"
            onClick={loadData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <div className="container py-4 py-md-5 page-fade">

      <div className="mb-4">
        <h1 className="h3 mb-1">
          My Claims
        </h1>

        <p className="text-muted-campus small mb-0">
          Track claims you submitted on found items and verify incoming
          ownership requests on your items.
        </p>
      </div>

      {/* ======================================
          SECTION A: MY SUBMITTED CLAIMS
      ====================================== */}

      <section
        className="mb-5"
        aria-labelledby="submitted-claims-heading"
      >

        <div className="d-flex align-items-center justify-content-between mb-3">

          <h2
            id="submitted-claims-heading"
            className="h5 mb-0"
          >
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
              <Link
                to="/"
                className="btn btn-campus-outline"
              >
                Browse Found Items
              </Link>
            }
          />

        ) : (

          <div className="d-flex flex-column gap-3">

            {mySubmittedClaims.map((claim, idx) => {
              const item = itemMap[claim.item_id];

              const catName = item
                ? categoryMap[item.category_id]
                : '';

              return (
                <div
                  key={claim.claim_id}
                  className="campus-card p-3 p-md-4 card-fade-up"
                  style={{
                    animationDelay: `${Math.min(idx * 40, 200)}ms`,
                  }}
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
                            <span className="text-muted-campus fw-semibold">
                              Removed Item
                            </span>
                          )}

                          {item && (
                            <StatusBadge value={item.type} />
                          )}

                          <StatusBadge value={claim.status} />

                        </div>

                        <p className="small text-muted-campus mb-2">
                          <strong className="text-dark">
                            Proof:
                          </strong>{' '}
                          {claim.proof}
                        </p>

                        <div className="small text-muted-campus tabular-nums">

                          <i className="bi bi-calendar3 me-1" />

                          Submitted{' '}
                          {formatDisplayDate(claim.created_at)}

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

      {/* ======================================
          SECTION B: INCOMING CLAIMS
      ====================================== */}

      <section
        aria-labelledby="incoming-claims-heading"
      >

        <div className="d-flex align-items-center justify-content-between mb-3">

          <h2
            id="incoming-claims-heading"
            className="h5 mb-0"
          >
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

              const isProcessing =
                processingClaimId === claim.claim_id;

              return (
                <div
                  key={claim.claim_id}
                  className="campus-card p-3 p-md-4 card-fade-up"
                  style={{
                    animationDelay: `${Math.min(idx * 40, 200)}ms`,
                  }}
                >

                  <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">

                    <div className="d-flex align-items-start gap-3 flex-grow-1">

                      <span
                        className="avatar-circle"
                        aria-hidden="true"
                      >
                        {getInitials(claimant?.name)}
                      </span>

                      <div className="flex-grow-1">

                        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">

                          <span
                            className="fw-bold"
                            style={{ color: 'var(--navy)' }}
                          >
                            {claimant?.name || 'Campus Member'}
                          </span>

                          <StatusBadge value={claim.status} />

                        </div>

                        {item && (
                          <div className="small mb-2 d-flex flex-wrap align-items-center gap-2">

                            <span className="text-muted-campus">
                              Claimed item:
                            </span>

                            <Link
                              to={`/items/${item.item_id}`}
                              className="fw-semibold text-decoration-none"
                            >
                              {item.title}
                            </Link>

                            <StatusBadge value={item.status} />

                          </div>
                        )}

                        <p
                          className="small mb-2"
                          style={{ color: 'var(--text)' }}
                        >
                          <strong>Proof submitted:</strong>{' '}
                          {claim.proof}
                        </p>

                        <div className="small text-muted-campus tabular-nums">

                          <i className="bi bi-calendar3 me-1" />

                          {formatDisplayDate(claim.created_at)}

                        </div>

                      </div>

                    </div>

                    {/* APPROVE / REJECT BUTTONS */}

                    <div className="d-flex align-items-center gap-2 flex-shrink-0">

                      {isPending ? (

                        <>

                          <button
                            type="button"
                            className="btn btn-success btn-sm px-3"
                            style={{
                              minHeight: '38px',
                              borderRadius: '8px',
                            }}
                            disabled={processingClaimId !== null}
                            onClick={() => handleApprove(claim)}
                          >

                            {isProcessing ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                />
                                Processing...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check-lg me-1" />
                                Approve
                              </>
                            )}

                          </button>

                          <button
                            type="button"
                            className="btn btn-danger btn-sm px-3"
                            style={{
                              minHeight: '38px',
                              borderRadius: '8px',
                            }}
                            disabled={processingClaimId !== null}
                            onClick={() => handleReject(claim)}
                          >
                            <i className="bi bi-x-lg me-1" />
                            Reject
                          </button>

                        </>

                      ) : claim.status === 'Approved' &&
                        item?.status === 'Claimed' ? (

                        <Link
                          to="/my-items"
                          className="btn btn-sm btn-campus-outline"
                        >
                          Go to My Items to Return
                        </Link>

                      ) : (

                        <span className="small text-muted-campus fw-medium">
                          Resolved
                        </span>

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