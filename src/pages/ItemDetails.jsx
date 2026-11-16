/**
 * src/pages/ItemDetails.jsx
 * Two-column item details layout: large photo/category artwork on left,
 * status timeline (Open -> Claimed -> Returned), info grid, description,
 * and action panel with Submit Claim modal on right.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getById, getAll, insert, update, remove } from '../services/db.js';
import { useAuth, canManageItem, assertCanManageItem } from '../utils/auth.js';
import { validateClaimForm, formatDisplayDate } from '../utils/validation.js';
import { useToast } from '../components/Toast.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import CategoryArt from '../components/CategoryArt.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EditItemModal from '../components/EditItemModal.jsx';

const TIMELINE_STEPS = ['Open', 'Claimed', 'Returned'];

function StatusTimeline({ currentStatus }) {
  const activeIdx = Math.max(0, TIMELINE_STEPS.indexOf(currentStatus));

  return (
    <div className="status-timeline mb-4" aria-label="Item lifecycle progress">
      {TIMELINE_STEPS.map((step, idx) => {
        const isCompleted = idx < activeIdx || (currentStatus === 'Returned' && idx === 2);
        const isActive = idx === activeIdx && currentStatus !== 'Returned';

        return (
          <React.Fragment key={step}>
            <div
              className={`timeline-step ${isCompleted ? 'completed' : ''} ${
                isActive ? 'active' : ''
              }`}
            >
              <span className="timeline-node">
                {isCompleted ? (
                  <i className="bi bi-check-lg" aria-hidden="true" />
                ) : (
                  idx + 1
                )}
              </span>
              <span
                className="small fw-semibold"
                style={{
                  color: isActive || isCompleted ? 'var(--navy)' : 'var(--muted)',
                }}
              >
                {step}
              </span>
            </div>
            {idx < TIMELINE_STEPS.length - 1 && (
              <div
                className={`timeline-connector ${idx < activeIdx ? 'completed' : ''}`}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [item, setItem] = useState(null);
  const [category, setCategory] = useState(null);
  const [location, setLocation] = useState(null);
  const [poster, setPoster] = useState(null);
  const [itemClaims, setItemClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit Claim modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [proof, setProof] = useState('');
  const [claimError, setClaimError] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadItemData = useCallback(() => {
    setLoading(true);
    const foundItem = getById('items', id);
    if (!foundItem) {
      setItem(null);
      setLoading(false);
      return;
    }

    setItem(foundItem);
    setCategory(getById('categories', foundItem.category_id));
    setLocation(getById('locations', foundItem.location_id));
    setPoster(getById('users', foundItem.user_id));

    const allClaims = getAll('claims').filter(
      (c) => Number(c.item_id) === Number(foundItem.item_id)
    );
    setItemClaims(allClaims);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadItemData();
  }, [loadItemData]);

  useEffect(() => {
    if (!showClaimModal) return undefined;
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !submittingClaim) {
        setShowClaimModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showClaimModal, submittingClaim]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading item details...</span>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container py-5 page-fade">
        <EmptyState
          title="Item Not Found"
          message="This item record does not exist or may have been deleted."
          action={
            <Link to="/" className="btn btn-campus-primary">
              Return to Browse Board
            </Link>
          }
        />
      </div>
    );
  }

  const isOwner = Number(item.user_id) === Number(user?.user_id);
  const canEditOrDelete = canManageItem(user, item);
  const isReturned = item.status === 'Returned';

  const myClaimsOnItem = itemClaims.filter(
    (c) => Number(c.user_id) === Number(user?.user_id)
  );
  const hasPendingClaim = myClaimsOnItem.some((c) => c.status === 'Pending');
  const latestMyClaim = myClaimsOnItem.length
    ? myClaimsOnItem[myClaimsOnItem.length - 1]
    : null;

  const canSubmitClaim =
    item.type === 'found' && !isOwner && item.status === 'Open' && !hasPendingClaim;

  const openClaimModal = () => {
    setProof('');
    setClaimError('');
    setShowClaimModal(true);
  };

  const handleSubmitClaim = (e) => {
    e.preventDefault();
    const validation = validateClaimForm({ proof_description: proof });
    if (!validation.isValid) {
      setClaimError(validation.errors.proof_description);
      return;
    }

    setSubmittingClaim(true);
    try {
      insert('claims', {
        item_id: item.item_id,
        user_id: user.user_id,
        proof_description: proof,
      });
      setProof('');
      setClaimError('');
      setShowClaimModal(false);
      toast.success('Claim submitted! The item owner will review your proof.');
      loadItemData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleMarkRecovered = () => {
    try {
      assertCanManageItem(user, item);
      update('items', item.item_id, { status: 'Returned' });
      toast.success('Item marked as Returned / Recovered.');
      loadItemData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteConfirm = () => {
    setDeleting(true);
    try {
      assertCanManageItem(user, item);
      remove('items', item.item_id);
      toast.success('Item and its associated claims were deleted.');
      navigate('/my-items');
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="container py-4 py-md-5 page-fade">
      <div className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <Link to="/" className="text-decoration-none small text-muted-campus">
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          Back to Browse Board
        </Link>
        <span className="font-mono-id text-muted-campus">ITEM #{item.item_id}</span>
      </div>

      <div className="row g-4 align-items-start">
        {/* Left Column: Large Photo or Category Gradient Tile */}
        <div className="col-12 col-lg-5">
          <div className="campus-card p-3">
            <CategoryArt
              image={item.image}
              title={item.title}
              categoryName={category?.category_name}
              variant="detail"
            />
          </div>
        </div>

        {/* Right Column: Info, Timeline, Description & Action Panel */}
        <div className="col-12 col-lg-7">
          <div className="campus-card p-4 p-md-5">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <StatusBadge value={item.type} />
              <StatusBadge value={item.status} />
            </div>

            <h1 className="h2 mb-3">{item.title}</h1>

            {/* Visual Status Timeline */}
            <StatusTimeline currentStatus={item.status} />

            {/* Info Grid */}
            <div
              className="row g-3 py-3 mb-4 border-top border-bottom"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="col-6 col-sm-4">
                <div className="small text-muted-campus">
                  <i className="bi bi-tag me-1" aria-hidden="true" />
                  Category
                </div>
                <div className="fw-semibold">{category?.category_name || 'Unknown'}</div>
              </div>
              <div className="col-6 col-sm-4">
                <div className="small text-muted-campus">
                  <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                  Location
                </div>
                <div className="fw-semibold">{location?.location_name || 'Unknown'}</div>
              </div>
              <div className="col-6 col-sm-4">
                <div className="small text-muted-campus">
                  <i className="bi bi-calendar3 me-1" aria-hidden="true" />
                  Date {item.type === 'lost' ? 'Lost' : 'Found'}
                </div>
                <div className="fw-semibold tabular-nums">
                  {formatDisplayDate(item.date)}
                </div>
              </div>
              <div className="col-6 col-sm-6">
                <div className="small text-muted-campus">
                  <i className="bi bi-person me-1" aria-hidden="true" />
                  Posted By
                </div>
                <div className="fw-semibold">
                  {poster?.name || 'Unknown'}
                  {poster?.role && (
                    <span className="text-muted-campus fw-normal small text-capitalize">
                      {' '}
                      ({poster.role})
                    </span>
                  )}
                </div>
              </div>
              <div className="col-6 col-sm-6">
                <div className="small text-muted-campus">
                  <i className="bi bi-clock me-1" aria-hidden="true" />
                  Created
                </div>
                <div className="fw-semibold tabular-nums">
                  {formatDisplayDate(item.created_at)}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <h2 className="h6 text-muted-campus mb-2">Description</h2>
              <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                {item.description}
              </p>
            </div>

            {/* Action Panel */}
            <div
              className="p-4 rounded-3 mb-4"
              style={{ backgroundColor: 'var(--ice)', border: '1px solid var(--border)' }}
            >
              <h3 className="h6 mb-3">
                {item.type === 'found' ? 'Claim & Verification' : 'Lost Item Actions'}
              </h3>

              {item.type === 'lost' ? (
                <div className="small text-muted-campus">
                  <p className="mb-3">
                    This is a <strong>Lost Item</strong> report. Claims apply only to Found items. If
                    you have found this belonging, please contact{' '}
                    <strong>{poster?.name || 'the owner'}</strong>.
                  </p>
                  {isOwner && item.status !== 'Returned' && (
                    <button
                      type="button"
                      className="btn btn-campus-primary"
                      onClick={handleMarkRecovered}
                    >
                      <i className="bi bi-check2-circle me-2" aria-hidden="true" />
                      Mark as Recovered
                    </button>
                  )}
                  {item.status === 'Returned' && (
                    <div className="alert alert-success py-2 px-3 small mb-0">
                      This lost item has been marked as recovered by its owner.
                    </div>
                  )}
                </div>
              ) : isOwner ? (
                <div className="small">
                  <p className="text-muted-campus mb-3">
                    You reported this Found item. Total claims received:{' '}
                    <strong className="tabular-nums">{itemClaims.length}</strong>.
                  </p>
                  <Link to="/my-claims" className="btn btn-campus-primary">
                    <i className="bi bi-clipboard-check me-2" aria-hidden="true" />
                    Review Incoming Claims
                  </Link>
                </div>
              ) : item.status !== 'Open' ? (
                <div className="alert alert-warning py-2 px-3 small mb-0">
                  {item.status === 'Claimed'
                    ? 'A claim on this item has already been approved and handover is in progress.'
                    : 'This item has already been returned to its owner. Claims are closed.'}
                </div>
              ) : hasPendingClaim ? (
                <div className="alert alert-info py-2 px-3 small mb-0">
                  You already have a <strong>Pending</strong> claim on this item. Check{' '}
                  <Link to="/my-claims" className="fw-semibold">
                    My Claims
                  </Link>{' '}
                  for updates.
                </div>
              ) : (
                <div>
                  {latestMyClaim && latestMyClaim.status === 'Rejected' && (
                    <div className="alert alert-danger py-2 px-3 small mb-3">
                      Your previous claim was rejected. If you have stronger proof, you can submit a
                      new claim.
                    </div>
                  )}
                  <p className="small text-muted-campus mb-3">
                    Think this item belongs to you? Submit proof of ownership so the finder can
                    verify your claim.
                  </p>
                  {canSubmitClaim && (
                    <button
                      type="button"
                      className="btn btn-campus-primary"
                      onClick={openClaimModal}
                    >
                      <i className="bi bi-hand-index-thumb me-2" aria-hidden="true" />
                      Submit Claim
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Owner / Admin Shortcuts */}
            {canEditOrDelete && (
              <div
                className="pt-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2"
                style={{ borderColor: 'var(--border)' }}
              >
                <div>
                  {!isReturned ? (
                    <button
                      type="button"
                      className="btn btn-campus-outline"
                      onClick={() => setShowEditModal(true)}
                    >
                      <i className="bi bi-pencil me-2" aria-hidden="true" />
                      Edit Item
                    </button>
                  ) : (
                    <span className="small text-muted-campus">
                      Returned items cannot be edited.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-outline-danger"
                  style={{ minHeight: '40px', borderRadius: '10px' }}
                  onClick={() => setShowDeleteModal(true)}
                >
                  <i className="bi bi-trash me-2" aria-hidden="true" />
                  Delete Item
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Claim Modal (Pure React, no Bootstrap JS) */}
      {showClaimModal && (
        <div
          className="campus-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-claim-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !submittingClaim) {
              setShowClaimModal(false);
            }
          }}
        >
          <div className="campus-modal-dialog p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <h5 id="submit-claim-modal-title" className="mb-0">
                Submit Ownership Claim
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close claim modal"
                disabled={submittingClaim}
                onClick={() => setShowClaimModal(false)}
              />
            </div>

            <p className="small text-muted-campus mb-3">
              Claiming: <strong style={{ color: 'var(--navy)' }}>{item.title}</strong>
            </p>

            <form onSubmit={handleSubmitClaim} noValidate>
              <div className="mb-4">
                <label htmlFor="modal-claim-proof" className="form-label">
                  Proof of Ownership
                </label>
                <textarea
                  id="modal-claim-proof"
                  rows={4}
                  className={`form-control ${claimError ? 'is-invalid' : ''}`}
                  placeholder="Describe unique marks, serial number, contents, lock screen wallpaper, or hidden tags..."
                  value={proof}
                  onChange={(e) => {
                    setProof(e.target.value);
                    if (claimError) setClaimError('');
                  }}
                />
                {claimError && <div className="invalid-feedback">{claimError}</div>}
              </div>

              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-campus-outline"
                  disabled={submittingClaim}
                  onClick={() => setShowClaimModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-campus-primary"
                  disabled={submittingClaim}
                >
                  {submittingClaim ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Claim'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <EditItemModal
        item={item}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSaved={() => loadItemData()}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Item?"
        message={`Deleting "${item.title}" will permanently remove this item and CASCADE delete all ${itemClaims.length} associated claim(s).`}
        confirmText="Delete Item"
        variant="danger"
        isProcessing={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
