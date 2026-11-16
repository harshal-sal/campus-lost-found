/**
 * src/pages/MyItems.jsx
 * Lists the logged-in user's items with photo thumbnails, Edit, Cascade Delete,
 * and "Mark as Returned" for Claimed items.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAll, update, remove } from '../services/db.js';
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

  const loadData = useCallback(() => {
    if (!user) return;
    const myItems = getAll('items')
      .filter((i) => Number(i.user_id) === Number(user.user_id))
      .sort((a, b) => b.item_id - a.item_id);
    setItems(myItems);
    setCategories(getAll('categories'));
    setLocations(getAll('locations'));
    setClaims(getAll('claims'));
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const claimCounts = useMemo(() => {
    const map = {};
    claims.forEach((c) => {
      map[c.item_id] = (map[c.item_id] || 0) + 1;
    });
    return map;
  }, [claims]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'All') return items;
    return items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const handleMarkReturned = (item) => {
    try {
      assertCanManageItem(user, item);
      if (item.status !== 'Claimed') {
        throw new Error('Only Claimed items can be marked as Returned.');
      }
      update('items', item.item_id, { status: 'Returned' });
      toast.success(`"${item.title}" has been marked as Returned.`);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      assertCanManageItem(user, deletingItem);
      remove('items', deletingItem.item_id);
      toast.success(`Deleted "${deletingItem.title}" and its associated claims.`);
      setDeletingItem(null);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container py-4 py-md-5 page-fade">
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">My Posted Items</h1>
          <p className="text-muted-campus small mb-0">
            Manage your reported items, update details or photos, and mark claimed items as returned.
          </p>
        </div>
        <Link to="/report" className="btn btn-campus-amber flex-shrink-0">
          <i className="bi bi-plus-lg me-2" aria-hidden="true" />
          Report New Item
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="campus-tab-bar mb-4" role="tablist" aria-label="Filter my items by status">
        {['All', 'Open', 'Claimed', 'Returned'].map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={statusFilter === tab}
            className={`campus-tab-btn ${statusFilter === tab ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="No items in this view"
          message={
            statusFilter === 'All'
              ? 'You have not posted any lost or found items yet.'
              : `You have no items with status "${statusFilter}".`
          }
          action={
            <Link to="/report" className="btn btn-campus-primary">
              Report an Item
            </Link>
          }
        />
      ) : (
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
                      <td className="font-mono-id text-muted-campus">#{item.item_id}</td>
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
                      <td>{locationMap[item.location_id] || 'Unknown'}</td>
                      <td className="tabular-nums text-nowrap">
                        {formatDisplayDate(item.date)}
                      </td>
                      <td className="tabular-nums">{count}</td>
                      <td className="text-end text-nowrap">
                        <div className="d-inline-flex align-items-center gap-2">
                          {isClaimed && (
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => handleMarkReturned(item)}
                            >
                              <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                              Mark as Returned
                            </button>
                          )}
                          <Link
                            to={`/items/${item.item_id}`}
                            className="btn btn-sm btn-campus-outline"
                            aria-label={`View ${item.title}`}
                            title="View Details"
                            style={{ minHeight: '34px', padding: '0.25rem 0.65rem' }}
                          >
                            <i className="bi bi-eye" aria-hidden="true" />
                          </Link>
                          {!isReturned && (
                            <button
                              type="button"
                              className="btn btn-sm btn-campus-outline"
                              aria-label={`Edit ${item.title}`}
                              title="Edit Item"
                              style={{ minHeight: '34px', padding: '0.25rem 0.65rem' }}
                              onClick={() => setEditingItem(item)}
                            >
                              <i className="bi bi-pencil" aria-hidden="true" />
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            aria-label={`Delete ${item.title}`}
                            title="Delete Item"
                            style={{ minHeight: '34px', padding: '0.25rem 0.65rem', borderRadius: '8px' }}
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

      <EditItemModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSaved={() => loadData()}
      />

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
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  );
}
