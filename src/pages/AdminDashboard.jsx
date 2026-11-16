/**
 * src/pages/AdminDashboard.jsx
 * Admin console with left sidebar (collapsing to tabs on mobile),
 * Overview SVG donut + bar status chart, StatCard KPIs,
 * searchable zebra tables with action icons, RESTRICT/CASCADE enforcement,
 * Database Viewer, and Reset Demo Data.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  getAll,
  insert,
  update,
  remove,
  approveClaim,
  rejectClaim,
  resetDatabase,
  getDatabaseMeta,
  SCHEMA_METADATA,
} from '../services/db.js';
import { useAuth, assertAdmin } from '../utils/auth.js';
import { formatDisplayDate } from '../utils/validation.js';
import { useToast } from '../components/Toast.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import CategoryArt from '../components/CategoryArt.jsx';
import StatCard from '../components/StatCard.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import EditItemModal from '../components/EditItemModal.jsx';

const TABS = [
  { id: 'overview', label: 'Overview', icon: 'bi-pie-chart' },
  { id: 'users', label: 'Users', icon: 'bi-people' },
  { id: 'items', label: 'Items', icon: 'bi-box-seam' },
  { id: 'claims', label: 'Claims', icon: 'bi-clipboard-check' },
  { id: 'taxonomy', label: 'Categories & Locations', icon: 'bi-tags' },
  { id: 'dbviewer', label: 'Database Viewer', icon: 'bi-database' },
];

function StatusDonutChart({ openCount, claimedCount, returnedCount }) {
  const total = openCount + claimedCount + returnedCount;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { label: 'Open', count: openCount, color: '#2563EB', softBg: '#DBEAFE' },
    { label: 'Claimed', count: claimedCount, color: '#F59E0B', softBg: '#FFEDD5' },
    { label: 'Returned', count: returnedCount, color: '#16A34A', softBg: '#DCFCE7' },
  ];

  let accumulated = 0;

  return (
    <div className="row g-4 align-items-center">
      <div className="col-12 col-sm-5 d-flex justify-content-center">
        <div className="position-relative" style={{ width: '160px', height: '160px' }}>
          <svg
            viewBox="0 0 150 150"
            className="w-100 h-100"
            role="img"
            aria-label={`Items by status: ${openCount} Open, ${claimedCount} Claimed, ${returnedCount} Returned`}
          >
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              stroke="var(--border)"
              strokeWidth="18"
            />
            {total > 0 &&
              segments.map((seg) => {
                if (seg.count === 0) return null;
                const segLength = (seg.count / total) * circumference;
                const dashOffset = -accumulated;
                accumulated += segLength;
                return (
                  <circle
                    key={seg.label}
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="18"
                    strokeDasharray={`${segLength} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    transform="rotate(-90 75 75)"
                  />
                );
              })}
          </svg>
          <div
            className="position-absolute top-50 start-50 translate-middle text-center"
            style={{ pointerEvents: 'none' }}
          >
            <div className="fs-4 fw-bold tabular-nums" style={{ color: 'var(--navy)' }}>
              {total}
            </div>
            <div className="small text-muted-campus" style={{ fontSize: '0.72rem' }}>
              Total Items
            </div>
          </div>
        </div>
      </div>

      <div className="col-12 col-sm-7">
        <div className="d-flex flex-column gap-3">
          {segments.map((seg) => {
            const pct = total > 0 ? Math.round((seg.count / total) * 100) : 0;
            return (
              <div key={seg.label}>
                <div className="d-flex justify-content-between align-items-center small mb-1">
                  <span className="d-inline-flex align-items-center gap-2 fw-semibold">
                    <span
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '999px',
                        backgroundColor: seg.color,
                        display: 'inline-block',
                      }}
                    />
                    <span>{seg.label}</span>
                  </span>
                  <span className="tabular-nums text-muted-campus">
                    <strong>{seg.count}</strong> ({pct}%)
                  </span>
                </div>
                <div
                  className="rounded-pill overflow-hidden"
                  style={{ height: '8px', backgroundColor: seg.softBg }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: seg.color,
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);
  const [dbMeta, setDbMeta] = useState(null);

  // Search filters
  const [userSearch, setUserSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('');
  const [itemStatusFilter, setItemStatusFilter] = useState('');
  const [claimSearch, setClaimSearch] = useState('');

  // Taxonomy add/edit
  const [newCategory, setNewCategory] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [newLocation, setNewLocation] = useState('');
  const [editingLoc, setEditingLoc] = useState(null);

  // DB Viewer
  const [viewerTable, setViewerTable] = useState('users');

  // Modals
  const [editingItem, setEditingItem] = useState(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    action: null,
  });

  const loadAllTables = useCallback(() => {
    setUsers(getAll('users'));
    setCategories(getAll('categories'));
    setLocations(getAll('locations'));
    setItems(getAll('items').sort((a, b) => b.item_id - a.item_id));
    setClaims(getAll('claims').sort((a, b) => b.claim_id - a.claim_id));
    setDbMeta(getDatabaseMeta());
  }, []);

  useEffect(() => {
    loadAllTables();
  }, [loadAllTables]);

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

  const locationMap = useMemo(() => {
    const map = {};
    locations.forEach((l) => {
      map[l.location_id] = l.location_name;
    });
    return map;
  }, [locations]);

  const itemMap = useMemo(() => {
    const map = {};
    items.forEach((i) => {
      map[i.item_id] = i;
    });
    return map;
  }, [items]);

  const openItemsCount = items.filter((i) => i.status === 'Open').length;
  const claimedItemsCount = items.filter((i) => i.status === 'Claimed').length;
  const returnedItemsCount = items.filter((i) => i.status === 'Returned').length;
  const pendingClaimsCount = claims.filter((c) => c.status === 'Pending').length;
  const lostItemsCount = items.filter((i) => i.type === 'lost').length;
  const foundItemsCount = items.filter((i) => i.type === 'found').length;

  const stats = useMemo(
    () => [
      {
        label: 'Total Users',
        value: users.length,
        icon: 'bi-people-fill',
        gradient: 'linear-gradient(90deg, #1D4ED8, #38BDF8)',
        iconBg: '#DBEAFE',
        iconColor: '#1D4ED8',
      },
      {
        label: 'Total Items',
        value: items.length,
        icon: 'bi-box-seam-fill',
        gradient: 'linear-gradient(90deg, #0B2A5B, #2563EB)',
        iconBg: '#EAF3FC',
        iconColor: '#0B2A5B',
      },
      {
        label: 'Open Items',
        value: openItemsCount,
        icon: 'bi-record-circle-fill',
        gradient: 'linear-gradient(90deg, #0284C7, #38BDF8)',
        iconBg: '#E0F2FE',
        iconColor: '#0284C7',
      },
      {
        label: 'Pending Claims',
        value: pendingClaimsCount,
        icon: 'bi-clock-fill',
        gradient: 'linear-gradient(90deg, #D97706, #F59E0B)',
        iconBg: '#FEF3C7',
        iconColor: '#B45309',
      },
      {
        label: 'Returned Items',
        value: returnedItemsCount,
        icon: 'bi-check-circle-fill',
        gradient: 'linear-gradient(90deg, #15803D, #22C55E)',
        iconBg: '#DCFCE7',
        iconColor: '#15803D',
      },
    ],
    [users.length, items.length, openItemsCount, pendingClaimsCount, returnedItemsCount]
  );

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    return items.filter((i) => {
      if (q && !i.title.toLowerCase().includes(q) && !i.description.toLowerCase().includes(q)) {
        return false;
      }
      if (itemTypeFilter && i.type !== itemTypeFilter) return false;
      if (itemStatusFilter && i.status !== itemStatusFilter) return false;
      return true;
    });
  }, [items, itemSearch, itemTypeFilter, itemStatusFilter]);

  const filteredClaims = useMemo(() => {
    const q = claimSearch.trim().toLowerCase();
    if (!q) return claims;
    return claims.filter((c) => {
      const itemTitle = (itemMap[c.item_id]?.title || '').toLowerCase();
      const claimantName = (userMap[c.user_id]?.name || '').toLowerCase();
      return (
        itemTitle.includes(q) ||
        claimantName.includes(q) ||
        c.proof_description.toLowerCase().includes(q)
      );
    });
  }, [claims, claimSearch, itemMap, userMap]);

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, isOpen: false, action: null }));
  };

  // User Actions
  const handleRoleChange = (targetUser, nextRole) => {
    try {
      assertAdmin(user);
      update('users', targetUser.user_id, { role: nextRole });
      toast.success(`Updated ${targetUser.name}'s role to ${nextRole}.`);
      loadAllTables();
      refreshUser();
    } catch (err) {
      toast.error(err.message);
      loadAllTables();
    }
  };

  const requestDeleteUser = (targetUser) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete User Account?',
      message: `Attempt to delete "${targetUser.name}" (${targetUser.email}). Users owning items or claims are protected by RESTRICT integrity.`,
      confirmText: 'Delete User',
      action: () => {
        assertAdmin(user);
        remove('users', targetUser.user_id);
        toast.success(`Deleted user "${targetUser.name}".`);
        loadAllTables();
      },
    });
  };

  // Item Actions
  const requestDeleteItem = (item) => {
    const count = claims.filter((c) => c.item_id === item.item_id).length;
    setConfirmState({
      isOpen: true,
      title: 'Delete Item?',
      message: `Deleting "${item.title}" will CASCADE delete ${count} associated claim(s). Continue?`,
      confirmText: 'Delete Item',
      action: () => {
        assertAdmin(user);
        remove('items', item.item_id);
        toast.success(`Deleted item "${item.title}" and cascaded claims.`);
        loadAllTables();
      },
    });
  };

  // Claim Actions
  const handleAdminApprove = (claim) => {
    try {
      assertAdmin(user);
      const res = approveClaim(claim.claim_id);
      const extra =
        res.autoRejectedCount > 0
          ? ` (${res.autoRejectedCount} competing pending claim(s) rejected.)`
          : '';
      toast.success(`Approved claim #${claim.claim_id}.${extra}`);
      loadAllTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAdminReject = (claim) => {
    try {
      assertAdmin(user);
      rejectClaim(claim.claim_id);
      toast.info(`Rejected claim #${claim.claim_id}.`);
      loadAllTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Category & Location Actions
  const handleAddCategory = (e) => {
    e.preventDefault();
    try {
      assertAdmin(user);
      insert('categories', { category_name: newCategory });
      setNewCategory('');
      toast.success('Category added.');
      loadAllTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveCategoryEdit = (e) => {
    e.preventDefault();
    if (!editingCat) return;
    try {
      assertAdmin(user);
      update('categories', editingCat.category_id, { category_name: editingCat.category_name });
      setEditingCat(null);
      toast.success('Category updated.');
      loadAllTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const requestDeleteCategory = (cat) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Category?',
      message: `Delete category "${cat.category_name}"? RESTRICT prevents deletion if any item references it.`,
      confirmText: 'Delete Category',
      action: () => {
        assertAdmin(user);
        remove('categories', cat.category_id);
        toast.success(`Category "${cat.category_name}" deleted.`);
        loadAllTables();
      },
    });
  };

  const handleAddLocation = (e) => {
    e.preventDefault();
    try {
      assertAdmin(user);
      insert('locations', { location_name: newLocation });
      setNewLocation('');
      toast.success('Location added.');
      loadAllTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveLocationEdit = (e) => {
    e.preventDefault();
    if (!editingLoc) return;
    try {
      assertAdmin(user);
      update('locations', editingLoc.location_id, { location_name: editingLoc.location_name });
      setEditingLoc(null);
      toast.success('Location updated.');
      loadAllTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const requestDeleteLocation = (loc) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Location?',
      message: `Delete location "${loc.location_name}"? RESTRICT prevents deletion if any item references it.`,
      confirmText: 'Delete Location',
      action: () => {
        assertAdmin(user);
        remove('locations', loc.location_id);
        toast.success(`Location "${loc.location_name}" deleted.`);
        loadAllTables();
      },
    });
  };

  // Reset Demo Data
  const requestResetDemo = () => {
    setConfirmState({
      isOpen: true,
      title: 'Reset Demo Database?',
      message:
        'This will erase all user-created items, claims, categories, and accounts, and restore the initial seed dataset.',
      confirmText: 'Reset Demo Data',
      action: () => {
        assertAdmin(user);
        resetDatabase();
        refreshUser();
        loadAllTables();
        toast.success('Database restored to initial demo seed state.');
      },
    });
  };

  const executeConfirm = () => {
    if (!confirmState.action) return;
    try {
      confirmState.action();
    } catch (err) {
      toast.error(err.message);
    } finally {
      closeConfirm();
    }
  };

  const rawTableMap = {
    users,
    categories,
    locations,
    items,
    claims,
  };

  const formatRawCell = (colName, value) => {
    if (colName === 'image' && typeof value === 'string' && value.startsWith('data:image/')) {
      return `[Compressed JPEG · ${Math.round(value.length / 1024)} KB]`;
    }
    if (value === null || value === undefined || value === '') return 'NULL';
    return String(value);
  };

  return (
    <div className="container py-4 py-md-5 page-fade">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Admin Console</h1>
          <p className="text-muted-campus small mb-0">
            Manage campus accounts, moderate items and claims, maintain lookup tables, and inspect live relational records.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-danger flex-shrink-0"
          style={{ minHeight: '40px', borderRadius: '10px' }}
          onClick={requestResetDemo}
        >
          <i className="bi bi-arrow-counterclockwise me-2" aria-hidden="true" />
          Reset Demo Data
        </button>
      </div>

      {/* Stat Cards */}
      <div className="row row-cols-2 row-cols-md-3 row-cols-xl-5 g-3 mb-4">
        {stats.map((st) => (
          <div key={st.label} className="col">
            <StatCard {...st} />
          </div>
        ))}
      </div>

      {/* Mobile Collapsible Tabs */}
      <div className="d-lg-none campus-tab-bar mb-4" role="tablist" aria-label="Admin sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`campus-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`bi ${tab.icon}`} aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Desktop Sidebar + Content Layout */}
      <div className="row g-4 align-items-start">
        <aside className="d-none d-lg-block col-lg-3">
          <div className="admin-sidebar d-flex flex-column gap-1" role="tablist" aria-label="Admin navigation">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`admin-sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <i className={`bi ${tab.icon}`} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="col-12 col-lg-9">
          {/* TAB 0: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="row g-4">
              <div className="col-12 col-xl-7">
                <div className="campus-card p-4 h-100">
                  <h2 className="h5 mb-1">Items by Status</h2>
                  <p className="small text-muted-campus mb-4">
                    Live distribution across Open, Claimed, and Returned states.
                  </p>
                  <StatusDonutChart
                    openCount={openItemsCount}
                    claimedCount={claimedItemsCount}
                    returnedCount={returnedItemsCount}
                  />
                </div>
              </div>

              <div className="col-12 col-xl-5">
                <div className="campus-card p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <h2 className="h5 mb-1">Lost vs. Found Breakdown</h2>
                    <p className="small text-muted-campus mb-4">
                      Report type ratio and lookup table counts.
                    </p>

                    <div className="d-flex flex-column gap-3 mb-4">
                      <div className="p-3 rounded-3" style={{ backgroundColor: 'var(--ice)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <StatusBadge value="lost" />
                          <span className="fw-bold tabular-nums" style={{ color: 'var(--navy)' }}>
                            {lostItemsCount} item(s)
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <StatusBadge value="found" />
                          <span className="fw-bold tabular-nums" style={{ color: 'var(--navy)' }}>
                            {foundItemsCount} item(s)
                          </span>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between small px-1 tabular-nums">
                        <span className="text-muted-campus">Categories configured</span>
                        <strong>{categories.length}</strong>
                      </div>
                      <div className="d-flex justify-content-between small px-1 tabular-nums">
                        <span className="text-muted-campus">Campus locations configured</span>
                        <strong>{locations.length}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-campus-primary"
                      onClick={() => setActiveTab('claims')}
                    >
                      Review Claims ({pendingClaimsCount} Pending)
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-campus-outline"
                      onClick={() => setActiveTab('dbviewer')}
                    >
                      Open DB Viewer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: USERS */}
          {activeTab === 'users' && (
            <div className="campus-card overflow-hidden">
              <div className="p-3 border-bottom d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
                <h2 className="h6 mb-0">Registered Users ({filteredUsers.length})</h2>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ maxWidth: '260px' }}
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <div className="table-responsive">
                <table className="table campus-table campus-table-zebra align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Activity</th>
                      <th>Created</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const ownedItems = items.filter((i) => i.user_id === u.user_id).length;
                      const ownedClaims = claims.filter((c) => c.user_id === u.user_id).length;
                      const isSelf = Number(u.user_id) === Number(user.user_id);
                      return (
                        <tr key={u.user_id}>
                          <td className="font-mono-id text-muted-campus">#{u.user_id}</td>
                          <td className="fw-semibold">
                            {u.name}{' '}
                            {isSelf && <span className="small text-primary fw-normal">(You)</span>}
                          </td>
                          <td>{u.email}</td>
                          <td style={{ minWidth: '130px' }}>
                            <select
                              aria-label={`Role for ${u.name}`}
                              className="form-select form-select-sm"
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                            >
                              <option value="student">student</option>
                              <option value="faculty">faculty</option>
                              <option value="admin">admin</option>
                            </select>
                          </td>
                          <td className="tabular-nums text-nowrap">
                            {ownedItems} items · {ownedClaims} claims
                          </td>
                          <td className="tabular-nums text-nowrap">
                            {formatDisplayDate(u.created_at)}
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              aria-label={`Delete user ${u.name}`}
                              title="Delete User (RESTRICT)"
                              onClick={() => requestDeleteUser(u)}
                            >
                              <i className="bi bi-trash" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ITEMS */}
          {activeTab === 'items' && (
            <div className="campus-card overflow-hidden">
              <div className="p-3 border-bottom">
                <div className="row g-2 align-items-center">
                  <div className="col-md-5">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Search items by title or description..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                    />
                  </div>
                  <div className="col-6 col-md-3">
                    <select
                      className="form-select form-select-sm"
                      value={itemTypeFilter}
                      onChange={(e) => setItemTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      <option value="lost">Lost</option>
                      <option value="found">Found</option>
                    </select>
                  </div>
                  <div className="col-6 col-md-4">
                    <select
                      className="form-select form-select-sm"
                      value={itemStatusFilter}
                      onChange={(e) => setItemStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="Open">Open</option>
                      <option value="Claimed">Claimed</option>
                      <option value="Returned">Returned</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table campus-table campus-table-zebra align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Item</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Owner</th>
                      <th>Date</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.item_id}>
                        <td className="font-mono-id text-muted-campus">#{item.item_id}</td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <CategoryArt
                              image={item.image}
                              title={item.title}
                              categoryName={categoryMap[item.category_id]}
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
                                {categoryMap[item.category_id] || '—'} ·{' '}
                                {locationMap[item.location_id] || '—'}
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
                        <td>{userMap[item.user_id]?.name || '—'}</td>
                        <td className="tabular-nums text-nowrap">
                          {formatDisplayDate(item.date)}
                        </td>
                        <td className="text-end text-nowrap">
                          <div className="d-inline-flex gap-1">
                            {item.status !== 'Returned' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-campus-outline"
                                aria-label={`Edit ${item.title}`}
                                title="Edit Item"
                                style={{ minHeight: '32px', padding: '0.2rem 0.55rem' }}
                                onClick={() => setEditingItem(item)}
                              >
                                <i className="bi bi-pencil" aria-hidden="true" />
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              aria-label={`Delete ${item.title}`}
                              title="Delete Item (CASCADE)"
                              onClick={() => requestDeleteItem(item)}
                            >
                              <i className="bi bi-trash" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted-campus">
                          No items match the current admin filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CLAIMS */}
          {activeTab === 'claims' && (
            <div className="campus-card overflow-hidden">
              <div className="p-3 border-bottom d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2">
                <h2 className="h6 mb-0">All Claims ({filteredClaims.length})</h2>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  style={{ maxWidth: '280px' }}
                  placeholder="Search by item, claimant, or proof..."
                  value={claimSearch}
                  onChange={(e) => setClaimSearch(e.target.value)}
                />
              </div>
              <div className="table-responsive">
                <table className="table campus-table campus-table-zebra align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Item</th>
                      <th>Claimant</th>
                      <th>Proof</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClaims.map((claim) => {
                      const item = itemMap[claim.item_id];
                      const claimant = userMap[claim.user_id];
                      return (
                        <tr key={claim.claim_id}>
                          <td className="font-mono-id text-muted-campus">#{claim.claim_id}</td>
                          <td>
                            {item ? (
                              <div>
                                <Link
                                  to={`/items/${item.item_id}`}
                                  className="fw-semibold text-decoration-none"
                                  style={{ color: 'var(--navy)' }}
                                >
                                  {item.title}
                                </Link>
                                <div className="mt-1 d-flex gap-1">
                                  <StatusBadge value={item.type} />
                                  <StatusBadge value={item.status} />
                                </div>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <div className="fw-medium">{claimant?.name || '—'}</div>
                            <div className="small text-muted-campus">{claimant?.email}</div>
                          </td>
                          <td style={{ maxWidth: '260px' }}>
                            <span className="small text-muted-campus">
                              {claim.proof_description}
                            </span>
                          </td>
                          <td className="tabular-nums text-nowrap">
                            {formatDisplayDate(claim.created_at)}
                          </td>
                          <td>
                            <StatusBadge value={claim.status} />
                          </td>
                          <td className="text-end text-nowrap">
                            {claim.status === 'Pending' ? (
                              <div className="d-inline-flex gap-1">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-success"
                                  aria-label={`Approve claim ${claim.claim_id}`}
                                  title="Approve Claim"
                                  onClick={() => handleAdminApprove(claim)}
                                >
                                  <i className="bi bi-check-lg" aria-hidden="true" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  aria-label={`Reject claim ${claim.claim_id}`}
                                  title="Reject Claim"
                                  onClick={() => handleAdminReject(claim)}
                                >
                                  <i className="bi bi-x-lg" aria-hidden="true" />
                                </button>
                              </div>
                            ) : (
                              <span className="small text-muted-campus">Resolved</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredClaims.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted-campus">
                          No claims match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORIES & LOCATIONS */}
          {activeTab === 'taxonomy' && (
            <div className="row g-4">
              <div className="col-12 col-xl-6">
                <div className="campus-card p-4 h-100">
                  <h2 className="h5 mb-3">Categories (RESTRICT Delete)</h2>
                  <form onSubmit={handleAddCategory} className="d-flex gap-2 mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="New category name..."
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <button type="submit" className="btn btn-campus-primary flex-shrink-0">
                      Add
                    </button>
                  </form>

                  <div className="table-responsive">
                    <table className="table campus-table campus-table-zebra align-middle">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Category Name</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => {
                          const isEditing = editingCat?.category_id === cat.category_id;
                          return (
                            <tr key={cat.category_id}>
                              <td className="font-mono-id text-muted-campus">#{cat.category_id}</td>
                              <td>
                                {isEditing ? (
                                  <form onSubmit={handleSaveCategoryEdit} className="d-flex gap-1">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={editingCat.category_name}
                                      onChange={(e) =>
                                        setEditingCat({
                                          ...editingCat,
                                          category_name: e.target.value,
                                        })
                                      }
                                    />
                                    <button type="submit" className="btn btn-sm btn-success">
                                      <i className="bi bi-check-lg" aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-campus-outline"
                                      onClick={() => setEditingCat(null)}
                                    >
                                      <i className="bi bi-x-lg" aria-hidden="true" />
                                    </button>
                                  </form>
                                ) : (
                                  <span className="fw-medium">{cat.category_name}</span>
                                )}
                              </td>
                              <td className="text-end text-nowrap">
                                {!isEditing && (
                                  <div className="d-inline-flex gap-1">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-campus-outline"
                                      aria-label={`Edit ${cat.category_name}`}
                                      style={{ minHeight: '32px', padding: '0.2rem 0.55rem' }}
                                      onClick={() => setEditingCat({ ...cat })}
                                    >
                                      <i className="bi bi-pencil" aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      aria-label={`Delete ${cat.category_name}`}
                                      onClick={() => requestDeleteCategory(cat)}
                                    >
                                      <i className="bi bi-trash" aria-hidden="true" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-6">
                <div className="campus-card p-4 h-100">
                  <h2 className="h5 mb-3">Locations (RESTRICT Delete)</h2>
                  <form onSubmit={handleAddLocation} className="d-flex gap-2 mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="New campus location..."
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                    />
                    <button type="submit" className="btn btn-campus-primary flex-shrink-0">
                      Add
                    </button>
                  </form>

                  <div className="table-responsive">
                    <table className="table campus-table campus-table-zebra align-middle">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Location Name</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations.map((loc) => {
                          const isEditing = editingLoc?.location_id === loc.location_id;
                          return (
                            <tr key={loc.location_id}>
                              <td className="font-mono-id text-muted-campus">#{loc.location_id}</td>
                              <td>
                                {isEditing ? (
                                  <form onSubmit={handleSaveLocationEdit} className="d-flex gap-1">
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={editingLoc.location_name}
                                      onChange={(e) =>
                                        setEditingLoc({
                                          ...editingLoc,
                                          location_name: e.target.value,
                                        })
                                      }
                                    />
                                    <button type="submit" className="btn btn-sm btn-success">
                                      <i className="bi bi-check-lg" aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-campus-outline"
                                      onClick={() => setEditingLoc(null)}
                                    >
                                      <i className="bi bi-x-lg" aria-hidden="true" />
                                    </button>
                                  </form>
                                ) : (
                                  <span className="fw-medium">{loc.location_name}</span>
                                )}
                              </td>
                              <td className="text-end text-nowrap">
                                {!isEditing && (
                                  <div className="d-inline-flex gap-1">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-campus-outline"
                                      aria-label={`Edit ${loc.location_name}`}
                                      style={{ minHeight: '32px', padding: '0.2rem 0.55rem' }}
                                      onClick={() => setEditingLoc({ ...loc })}
                                    >
                                      <i className="bi bi-pencil" aria-hidden="true" />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      aria-label={`Delete ${loc.location_name}`}
                                      onClick={() => requestDeleteLocation(loc)}
                                    >
                                      <i className="bi bi-trash" aria-hidden="true" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DATABASE VIEWER */}
          {activeTab === 'dbviewer' && (
            <div className="campus-card p-4">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-3">
                <div>
                  <h2 className="h5 mb-1">Database Schema &amp; Raw Table Viewer</h2>
                  <p className="small text-muted-campus mb-0">
                    Read-only inspection of <code className="font-mono-id">localStorage</code>{' '}
                    tables, Primary Keys (PK), Foreign Keys (FK), and auto-increment counters.
                  </p>
                </div>
                {dbMeta && (
                  <div className="small text-muted-campus font-mono-id">
                    Next IDs: U={dbMeta.counters.users + 1} · C={dbMeta.counters.categories + 1} ·
                    L={dbMeta.counters.locations + 1} · I={dbMeta.counters.items + 1} · CL=
                    {dbMeta.counters.claims + 1}
                  </div>
                )}
              </div>

              <div className="d-flex flex-wrap gap-2 mb-4">
                {Object.keys(SCHEMA_METADATA).map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    className={`btn btn-sm ${
                      viewerTable === tbl ? 'btn-campus-primary' : 'btn-campus-outline'
                    }`}
                    style={{ minHeight: '34px' }}
                    onClick={() => setViewerTable(tbl)}
                  >
                    {SCHEMA_METADATA[tbl].storageKey} ({rawTableMap[tbl].length})
                  </button>
                ))}
              </div>

              <div className="table-responsive border rounded">
                <table className="table campus-table campus-table-zebra align-middle mb-0">
                  <thead>
                    <tr>
                      {SCHEMA_METADATA[viewerTable].columns.map((col) => (
                        <th key={col.name}>
                          <span className="font-mono-id">{col.name}</span>
                          {col.badge && (
                            <span
                              className={`ms-2 badge ${
                                col.badge === 'PK'
                                  ? 'bg-primary'
                                  : col.badge === 'UNIQUE'
                                    ? 'bg-secondary'
                                    : 'bg-info text-dark'
                              }`}
                              style={{ fontSize: '0.68rem' }}
                            >
                              {col.badge}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawTableMap[viewerTable].map((row, idx) => (
                      <tr key={idx}>
                        {SCHEMA_METADATA[viewerTable].columns.map((col) => (
                          <td
                            key={col.name}
                            className="font-mono-id"
                            style={{
                              maxWidth: '220px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={formatRawCell(col.name, row[col.name])}
                          >
                            {formatRawCell(col.name, row[col.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {rawTableMap[viewerTable].length === 0 && (
                      <tr>
                        <td
                          colSpan={SCHEMA_METADATA[viewerTable].columns.length}
                          className="text-center py-4 text-muted-campus"
                        >
                          Table is empty.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <EditItemModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSaved={() => loadAllTables()}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant="danger"
        onConfirm={executeConfirm}
        onCancel={closeConfirm}
      />
    </div>
  );
}
