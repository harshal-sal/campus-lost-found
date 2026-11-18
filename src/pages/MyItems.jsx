import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { Link } from 'react-router-dom';

import { supabase } from '../services/supabase.js';
import { useAuth, assertCanManageItem } from '../utils/auth.js';
import { formatDisplayDate } from '../utils/validation.js';
import { useToast } from '../components/Toast.jsx';

import StatusBadge from '../components/StatusBadge.jsx';
import CategoryArt from '../components/CategoryArt.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EditItemModal from '../components/EditItemModal.jsx';

export default function MyItems() {
  const { user } = useAuth();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [claims, setClaims] = useState([]);

  const [statusFilter, setStatusFilter] = useState('All');

  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const [deleting, setDeleting] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // ==========================================
  // LOAD MY ITEMS FROM SUPABASE
  // ==========================================

  const loadData = useCallback(async () => {
    if (!user?.user_id) {
      setItems([]);
      setClaims([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError('');

    try {
      const [
        itemResult,
        categoryResult,
        locationResult,
      ] = await Promise.all([
        supabase
          .from('items')
          .select('*')
          .eq('user_id', user.user_id)
          .order('item_id', { ascending: false }),

        supabase
          .from('categories')
          .select('*')
          .order('category_id'),

        supabase
          .from('locations')
          .select('*')
          .order('location_id'),
      ]);

      if (itemResult.error) throw itemResult.error;
      if (categoryResult.error) throw categoryResult.error;
      if (locationResult.error) throw locationResult.error;

      const myItems = itemResult.data || [];

      // ======================================
      // LOAD CLAIMS FOR MY ITEMS
      // ======================================

      let myClaims = [];

      if (myItems.length > 0) {
        const itemIds = myItems.map((item) => item.item_id);

        const { data: claimData, error: claimError } =
          await supabase
            .from('claims')
            .select('*')
            .in('item_id', itemIds);

        if (claimError) throw claimError;

        myClaims = claimData || [];
      }

      // ======================================
      // GENERATE SIGNED IMAGE URLS
      // ======================================

      const itemsWithImages = await Promise.all(
        myItems.map(async (item) => {
          if (!item.image) {
            return {
              ...item,
              image: null,
              imagePath: null,
            };
          }

          const { data, error } = await supabase.storage
            .from('item-images')
            .createSignedUrl(item.image, 3600);

          if (error) {
            console.error(
              `Image loading error for item ${item.item_id}:`,
              error
            );
          }

          return {
            ...item,
            image: error ? null : data.signedUrl,
            imagePath: item.image,
          };
        })
      );

      setItems(itemsWithImages);
      setCategories(categoryResult.data || []);
      setLocations(locationResult.data || []);
      setClaims(myClaims);

    } catch (error) {
      console.error('My Items loading error:', error);

      setLoadError(
        error.message || 'Unable to load your posted items.'
      );

    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // CATEGORY MAP
  // ==========================================

  const categoryMap = useMemo(() => {
    const map = {};

    categories.forEach((category) => {
      map[category.category_id] = category.category_name;
    });

    return map;
  }, [categories]);

  // ==========================================
  // LOCATION MAP
  // ==========================================

  const locationMap = useMemo(() => {
    const map = {};

    locations.forEach((location) => {
      map[location.location_id] = location.location_name;
    });

    return map;
  }, [locations]);

  // ==========================================
  // CLAIM COUNTS
  // ==========================================

  const claimCounts = useMemo(() => {
    const map = {};

    claims.forEach((claim) => {
      map[claim.item_id] = (map[claim.item_id] || 0) + 1;
    });

    return map;
  }, [claims]);

  // ==========================================
  // STATUS FILTER
  // ==========================================

  const filteredItems = useMemo(() => {
    if (statusFilter === 'All') {
      return items;
    }

    return items.filter(
      (item) => item.status === statusFilter
    );
  }, [items, statusFilter]);

  // ==========================================
  // MARK ITEM AS RETURNED
  // ==========================================

  const handleMarkReturned = async (item) => {
    setUpdatingItemId(item.item_id);

    try {
      assertCanManageItem(user, item);

      if (item.status !== 'Claimed') {
        throw new Error(
          'Only Claimed items can be marked as Returned.'
        );
      }

      const { data, error } = await supabase
        .from('items')
        .update({ status: 'Returned' })
        .eq('item_id', item.item_id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        throw new Error('Unable to update item status.');
      }

      toast.success(
        `"${item.title}" has been marked as Returned.`
      );

      await loadData();

    } catch (error) {
      console.error('Mark returned error:', error);
      toast.error(error.message);

    } finally {
      setUpdatingItemId(null);
    }
  };

  // ==========================================
  // DELETE ITEM
  // ==========================================

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;

    setDeleting(true);

    try {
      assertCanManageItem(user, deletingItem);

      // Preserve original Storage path.
      const imagePath = deletingItem.imagePath;

      // Delete PostgreSQL item.
      // Associated claims are removed through ON DELETE CASCADE.
      const { data, error } = await supabase
        .from('items')
        .delete()
        .eq('item_id', deletingItem.item_id)
        .select('item_id')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          'Item was not deleted. Check your permissions.'
        );
      }

      // Remove associated image from private Storage bucket.
      let imageCleanupFailed = false;

      if (imagePath) {
        const { error: imageError } = await supabase.storage
          .from('item-images')
          .remove([imagePath]);

        if (imageError) {
          console.error('Image deletion error:', imageError);
          imageCleanupFailed = true;
        }
      }

      setDeletingItem(null);

      if (imageCleanupFailed) {
        toast.warning(
          'Item and claims deleted, but the image could not be removed.'
        );
      } else {
        toast.success(
          `Deleted "${deletingItem.title}" and its associated claims.`
        );
      }

      await loadData();

    } catch (error) {
      console.error('Item deletion error:', error);
      toast.error(error.message || 'Unable to delete item.');

    } finally {
      setDeleting(false);
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
            Loading your items...
          </span>
        </div>

        <p className="small text-muted-campus mt-3">
          Loading your posted items...
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
          <strong>Unable to load your items.</strong>

          <p className="mb-3">{loadError}</p>

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
  // UI
  // ==========================================

  return (
    <div className="container py-4 py-md-5 page-fade">

      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">

        <div>
          <h1 className="h3 mb-1">
            My Posted Items
          </h1>

          <p className="text-muted-campus small mb-0">
            Manage your reported items, update details or photos,
            and mark claimed items as returned.
          </p>
        </div>

        <Link
          to="/report"
          className="btn btn-campus-amber flex-shrink-0"
        >
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Report New Item
        </Link>

      </div>

      {/* FILTER TABS */}

      <div
        className="campus-tab-bar mb-4"
        role="tablist"
        aria-label="Filter my items by status"
      >

        {['All', 'Open', 'Claimed', 'Returned'].map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={statusFilter === tab}
            className={`campus-tab-btn ${
              statusFilter === tab ? 'active' : ''
            }`}
            onClick={() => setStatusFilter(tab)}
          >
            {tab}
          </button>
        ))}

      </div>

      {/* EMPTY STATE */}

      {filteredItems.length === 0 ? (

        <EmptyState
          title="No items in this view"
          message={
            statusFilter === 'All'
              ? 'You have not posted any lost or found items yet.'
              : `You have no items with status "${statusFilter}".`
          }
          action={
            <Link
              to="/report"
              className="btn btn-campus-primary"
            >
              Report an Item
            </Link>
          }
        />

      ) : (

        /* ITEMS TABLE */

        <div className="campus-card overflow-hidden">

          <div className="table-responsive">

            <table className="table campus-table campus-table-zebra align-middle">

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Claims</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredItems.map((item) => {
                  const isReturned = item.status === 'Returned';
                  const isClaimed = item.status === 'Claimed';

                  const count = claimCounts[item.item_id] || 0;

                  const catName = categoryMap[item.category_id];

                  return (
                    <tr key={item.item_id}>

                      <td className="font-mono-id text-muted-campus">
                        #{item.item_id}
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-3">

                          <CategoryArt
                            image={item.image}
                            title={item.title}
                            categoryName={catName}
                            variant="thumb"
                          />

                          <div>
                            <Link
                              to={`/items/${item.item_id}`}
                              className="fw-semibold text-decoration-none"
                              style={{ color: 'var(--navy)' }}
                            >
                              {item.title}
                            </Link>

                            <div className="small text-muted-campus">
                              {catName || 'General'}
                            </div>
                          </div>

                        </div>
                      </td>

                      <td>
                        <StatusBadge value={item.type} />
                      </td>

                      <td>
                        <StatusBadge value={item.status} />
                      </td>

                      <td>
                        {locationMap[item.location_id] || 'Unknown'}
                      </td>

                      <td className="tabular-nums text-nowrap">
                        {formatDisplayDate(item.date)}
                      </td>

                      <td className="tabular-nums">
                        {count}
                      </td>

                      <td className="text-end text-nowrap">

                        <div className="d-inline-flex align-items-center gap-2">

                          {/* MARK AS RETURNED */}

                          {isClaimed && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              disabled={updatingItemId === item.item_id}
                              onClick={() => handleMarkReturned(item)}
                            >
                              {updatingItemId === item.item_id ? (
                                <span className="spinner-border spinner-border-sm me-1" />
                              ) : (
                                <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                              )}

                              Mark as Returned
                            </button>
                          )}

                          {/* VIEW */}

                          <Link
                            to={`/items/${item.item_id}`}
                            className="btn btn-sm btn-campus-outline"
                            aria-label={`View ${item.title}`}
                            title="View Details"
                            style={{
                              minHeight: '34px',
                              padding: '0.25rem 0.65rem',
                            }}
                          >
                            <i className="bi bi-eye" aria-hidden="true" />
                          </Link>

                          {/* EDIT */}

                          {!isReturned && (
                            <button
                              type="button"
                              className="btn btn-sm btn-campus-outline"
                              aria-label={`Edit ${item.title}`}
                              title="Edit Item"
                              style={{
                                minHeight: '34px',
                                padding: '0.25rem 0.65rem',
                              }}
                              onClick={() => setEditingItem(item)}
                            >
                              <i className="bi bi-pencil" aria-hidden="true" />
                            </button>
                          )}

                          {/* DELETE */}

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            aria-label={`Delete ${item.title}`}
                            title="Delete Item"
                            style={{
                              minHeight: '34px',
                              padding: '0.25rem 0.65rem',
                              borderRadius: '8px',
                            }}
                            onClick={() => setDeletingItem(item)}
                          >
                            <i className="bi bi-trash" aria-hidden="true" />
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>

        </div>

      )}

      {/* EDIT ITEM MODAL */}

      <EditItemModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSaved={loadData}
      />

      {/* DELETE CONFIRMATION */}

      <ConfirmModal
        isOpen={Boolean(deletingItem)}
        title="Delete Item?"
        message={
          deletingItem
            ? `Deleting "${deletingItem.title}" will CASCADE delete ${
                claimCounts[deletingItem.item_id] || 0
              } associated claim(s). Continue?`
            : ''
        }
        confirmText="Delete Item"
        variant="danger"
        isProcessing={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!deleting) {
            setDeletingItem(null);
          }
        }}
      />

    </div>
  );
}