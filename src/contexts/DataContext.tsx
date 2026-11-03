import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Item,
  Claim,
  ItemMatch,
  Handover,
  AppNotification,
  SavedItem,
  ReportAbuse,
  Category,
  CampusLocation,
  AuditLog,
  ItemStatus,
  ClaimStatus,
  FilterOptions,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_ITEMS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../data/seedData';
import {
  LOCAL_STORAGE_KEYS,
  loadFromLocalStorage,
  saveToLocalStorage,
} from '../services/supabase';
import { calculateItemSimilarity, findMatchesForSingleItem } from '../services/matchingEngine';
import { useAuth } from './AuthContext';

interface DataContextType {
  // Data lists
  items: Item[];
  claims: Claim[];
  matches: ItemMatch[];
  handovers: Handover[];
  notifications: AppNotification[];
  savedItems: SavedItem[];
  reports: ReportAbuse[];
  categories: Category[];
  locations: CampusLocation[];
  auditLogs: AuditLog[];

  // Unread count
  unreadNotificationCount: number;

  // Item Operations
  createItem: (itemData: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'views_count' | 'is_approved'>) => Promise<Item>;
  updateItem: (id: string, itemData: Partial<Item>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  incrementItemViews: (id: string) => void;
  getItemById: (id: string) => Item | undefined;

  // Search & Filtering
  filterItems: (options: FilterOptions) => Item[];

  // Claims Operations
  submitClaim: (claimData: {
    item_id: string;
    verification_details: string;
    unique_identifier?: string;
    lost_place_time: string;
    proof_url?: string;
    claimant_phone?: string;
    claimant_id_number?: string;
    additional_notes?: string;
  }) => Promise<{ success: boolean; claim?: Claim; error?: string }>;
  reviewClaim: (claimId: string, status: ClaimStatus, reviewNotes: string, customHandoverLocation?: string) => Promise<boolean>;
  getClaimsForItem: (itemId: string) => Claim[];
  getUserClaims: (userId: string) => Claim[];

  // Matches Operations
  getItemMatches: (itemId: string) => ItemMatch[];
  getUserMatches: (userId: string) => ItemMatch[];
  dismissMatch: (matchId: string) => void;

  // Handover Operations
  scheduleHandover: (handoverData: {
    item_id: string;
    claim_id: string;
    claimant_id: string;
    claimant_name: string;
    claimant_email: string;
    handover_location: string;
    security_desk_name?: string;
    scheduled_at?: string;
    notes?: string;
  }) => Promise<Handover>;
  completeHandover: (handoverId: string, enteredPin: string) => Promise<{ success: boolean; error?: string }>;

  // Notifications Operations
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (notificationId: string) => void;

  // Saved Items Operations
  toggleSaveItem: (itemId: string) => boolean;
  isItemSaved: (itemId: string) => boolean;
  getUserSavedItems: () => Item[];

  // Abuse Reports
  abuseReports: ReportAbuse[];
  reportAbuse: (reportData: {
    item_id: string;
    item_title: string;
    reason: ReportAbuse['reason'];
    description: string;
  }) => Promise<boolean>;
  resolveReport: (reportId: string, status: ReportAbuse['status']) => Promise<boolean>;
  resolveAbuseReport: (reportId: string, status: ReportAbuse['status']) => Promise<boolean>;

  // Admin & Management Operations
  updateItemStatus: (id: string, status: ItemStatus) => Promise<boolean>;
  adminModerateItem: (itemId: string, action: 'approve' | 'reject' | 'close' | 'delete') => Promise<boolean>;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  addLocation: (location: CampusLocation) => void;
  updateLocation: (id: string, updates: Partial<CampusLocation>) => void;
  addAuditLog: (action: string, entity_type: AuditLog['entity_type'], entity_id: string, metadata?: any) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // State with local storage persistence
  const [items, setItems] = useState<Item[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.ITEMS, INITIAL_ITEMS)
  );

  const [categories, setCategories] = useState<Category[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES)
  );

  const [locations, setLocations] = useState<CampusLocation[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS)
  );

  const [claims, setClaims] = useState<Claim[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.CLAIMS, [
      {
        id: 'claim-sample-1',
        item_id: 'item-found-macbook',
        item_title: 'Space Gray Apple Laptop in Black Sleeve',
        item_type: 'found',
        item_image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80',
        claimant_id: 'user-student-alex',
        claimant_name: 'Alex Rivera',
        claimant_email: 'alex.rivera@campus.edu',
        claimant_phone: '+1 (555) 234-5678',
        claimant_id_number: 'STU-2024-8841',
        verification_details: 'It has a GitHub Octocat sticker and React logo. Top right edge has a slight nick.',
        unique_identifier: 'Serial starts with C02G. Username on lock screen is Alex Rivera.',
        lost_place_time: 'Lost around 17:30 on 3rd floor library cubicle #14.',
        proof_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
        status: 'pending',
        created_at: '2026-08-16T20:10:00Z',
      },
    ])
  );

  const [matches, setMatches] = useState<ItemMatch[]>(() => {
    const saved = loadFromLocalStorage<ItemMatch[]>(LOCAL_STORAGE_KEYS.MATCHES, []);
    if (saved && saved.length > 0) return saved;
    // Initial auto-computed matches
    const initialComputed: ItemMatch[] = [
      {
        id: 'match-item-lost-macbook-item-found-macbook',
        lost_item_id: 'item-lost-macbook',
        found_item_id: 'item-found-macbook',
        similarity_score: 92,
        confidence: 'high',
        match_reasons: [
          'Same item category match (Electronics)',
          'Matched keywords: macbook, gray, space, sleeve, stickers',
          'Reported at the same campus building / location (Main Campus Library)',
          'Identical date of occurrence (2026-08-16)',
        ],
        status: 'potential',
        created_at: '2026-08-16T19:45:00Z',
      },
    ];
    return initialComputed;
  });

  const [handovers, setHandovers] = useState<Handover[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.HANDOVERS, [
      {
        id: 'handover-sample-1',
        item_id: 'item-lost-backpack',
        item_title: 'Forest Green Fjällräven Kånken Backpack',
        claim_id: 'claim-recovered-1',
        claimant_id: 'user-student-alex',
        claimant_name: 'Alex Rivera',
        claimant_email: 'alex.rivera@campus.edu',
        finder_id: 'user-staff-sarah',
        finder_name: 'Prof. Sarah Jenkins',
        handover_location: 'Central Public Safety Office (Admin Annex Room 102)',
        security_desk_name: 'Officer Marcus Vance',
        verification_pin: '8492',
        scheduled_at: '2026-08-15T10:30:00Z',
        completed_at: '2026-08-15T11:00:00Z',
        status: 'completed',
        verified_by_admin: true,
        notes: 'Claimant presented student ID and verified inner nametag patch.',
        created_at: '2026-08-15T10:00:00Z',
      },
    ])
  );

  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
  );

  const [savedItems, setSavedItems] = useState<SavedItem[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.SAVED_ITEMS, [
      {
        id: 'saved-1',
        user_id: 'user-student-alex',
        item_id: 'item-found-macbook',
        created_at: '2026-08-16T19:50:00Z',
      },
    ])
  );

  const [reports, setReports] = useState<ReportAbuse[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.REPORTS, [])
  );

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() =>
    loadFromLocalStorage(LOCAL_STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS)
  );

  // Sync state to local storage
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.ITEMS, items); }, [items]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.CATEGORIES, categories); }, [categories]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.LOCATIONS, locations); }, [locations]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.CLAIMS, claims); }, [claims]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.MATCHES, matches); }, [matches]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.HANDOVERS, handovers); }, [handovers]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.NOTIFICATIONS, notifications); }, [notifications]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.SAVED_ITEMS, savedItems); }, [savedItems]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.REPORTS, reports); }, [reports]);
  useEffect(() => { saveToLocalStorage(LOCAL_STORAGE_KEYS.AUDIT_LOGS, auditLogs); }, [auditLogs]);

  // Unread notification count
  const unreadNotificationCount = useMemo(() => {
    if (!currentUser) return 0;
    return notifications.filter((n) => n.user_id === currentUser.id && !n.is_read).length;
  }, [notifications, currentUser]);

  // Helper to add audit logs
  const addAuditLog = (
    action: string,
    entity_type: AuditLog['entity_type'],
    entity_id: string,
    metadata?: any
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actor_id: currentUser?.id || 'system',
      actor_name: currentUser?.full_name || 'System',
      actor_role: currentUser?.role || 'student',
      action,
      entity_type,
      entity_id,
      metadata,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Helper to add notification
  const sendNotification = (
    userId: string,
    title: string,
    message: string,
    type: AppNotification['type'],
    relatedItemId?: string,
    relatedClaimId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: userId,
      title,
      message,
      type,
      related_item_id: relatedItemId,
      related_claim_id: relatedClaimId,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Create Item
  const createItem = async (
    itemData: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'views_count' | 'is_approved'>
  ): Promise<Item> => {
    const newItem: Item = {
      ...itemData,
      id: `item-${itemData.type}-${Date.now()}`,
      views_count: 0,
      is_approved: true, // Auto-approved or pending moderator
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setItems((prev) => [newItem, ...prev]);

    addAuditLog(`CREATED_${itemData.type.toUpperCase()}_REPORT`, 'item', newItem.id, {
      title: newItem.title,
      category_id: newItem.category_id,
    });

    // Run similarity engine immediately to check potential matches
    const newMatches = findMatchesForSingleItem(newItem, items);
    if (newMatches.length > 0) {
      setMatches((prev) => [...newMatches, ...prev]);

      // Notify the item reporter if matches found
      const topMatch = newMatches[0];
      sendNotification(
        newItem.owner_id,
        'Potential Match Found!',
        `We found ${newMatches.length} potential ${newItem.type === 'lost' ? 'found' : 'lost'} match(es) for your "${newItem.title}".`,
        'match_detected',
        newItem.id
      );

      // Also notify the owners of the matched opposite items
      newMatches.forEach((m) => {
        const otherItemId = newItem.type === 'lost' ? m.found_item_id : m.lost_item_id;
        const otherItem = items.find((i) => i.id === otherItemId);
        if (otherItem && otherItem.owner_id !== newItem.owner_id) {
          sendNotification(
            otherItem.owner_id,
            'New Potential Match Reported!',
            `A newly reported ${newItem.type} item "${newItem.title}" may match your item.`,
            'match_detected',
            otherItem.id
          );
        }
      });
    }

    return newItem;
  };

  const updateItem = async (id: string, updates: Partial<Item>): Promise<boolean> => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
      )
    );
    addAuditLog('UPDATED_ITEM', 'item', id, updates);
    return true;
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    addAuditLog('DELETED_ITEM', 'item', id);
    return true;
  };

  const incrementItemViews = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, views_count: item.views_count + 1 } : item))
    );
  };

  const getItemById = (id: string): Item | undefined => {
    return items.find((i) => i.id === id);
  };

  // Filter Items
  const filterItems = (options: FilterOptions): Item[] => {
    return items.filter((item) => {
      // 1. Search Query
      if (options.searchQuery && options.searchQuery.trim() !== '') {
        const query = options.searchQuery.toLowerCase().trim();
        const categoryName = categories.find((c) => c.id === item.category_id)?.name.toLowerCase() || '';
        const locationName = locations.find((l) => l.id === item.location_id)?.name.toLowerCase() || '';
        const buildingName = locations.find((l) => l.id === item.location_id)?.building.toLowerCase() || '';

        const matchesQuery =
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.distinguishing_features && item.distinguishing_features.toLowerCase().includes(query)) ||
          categoryName.includes(query) ||
          locationName.includes(query) ||
          buildingName.includes(query);

        if (!matchesQuery) return false;
      }

      // 2. Type filter
      if (options.type && options.type !== 'all' && item.type !== options.type) {
        return false;
      }

      // 3. Category filter
      if (options.categoryId && options.categoryId !== 'all' && item.category_id !== options.categoryId) {
        return false;
      }

      // 4. Location filter
      if (options.locationId && options.locationId !== 'all' && item.location_id !== options.locationId) {
        return false;
      }

      // 5. Status filter
      if (options.status && options.status !== 'all' && item.status !== options.status) {
        return false;
      }

      // 6. Date From
      if (options.dateFrom && new Date(item.date_occurred) < new Date(options.dateFrom)) {
        return false;
      }

      // 7. Date To
      if (options.dateTo && new Date(item.date_occurred) > new Date(options.dateTo)) {
        return false;
      }

      // 8. Reward
      if (options.hasReward && (!item.reward_info || item.reward_info.trim() === '')) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (options.sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (options.sortBy === 'views') {
        return b.views_count - a.views_count;
      }
      if (options.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      // Default recent
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  };

  // Submit Claim
  const submitClaim = async (claimData: {
    item_id: string;
    verification_details: string;
    unique_identifier?: string;
    lost_place_time: string;
    proof_url?: string;
    claimant_phone?: string;
    claimant_id_number?: string;
    additional_notes?: string;
  }): Promise<{ success: boolean; claim?: Claim; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'You must be logged in to claim an item.' };
    }

    const item = items.find((i) => i.id === claimData.item_id);
    if (!item) {
      return { success: false, error: 'Item not found.' };
    }

    if (item.owner_id === currentUser.id) {
      return { success: false, error: 'You cannot claim an item that you reported.' };
    }

    // Check duplicate pending claims
    const existing = claims.find(
      (c) => c.item_id === claimData.item_id && c.claimant_id === currentUser.id && c.status === 'pending'
    );
    if (existing) {
      return { success: false, error: 'You already have an active pending claim on this item.' };
    }

    const newClaim: Claim = {
      id: `claim-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      item_id: item.id,
      item_title: item.title,
      item_type: item.type,
      item_image: item.image_url,
      claimant_id: currentUser.id,
      claimant_name: currentUser.full_name,
      claimant_email: currentUser.email,
      claimant_phone: claimData.claimant_phone || currentUser.phone,
      claimant_id_number: claimData.claimant_id_number || currentUser.student_staff_id,
      verification_details: claimData.verification_details,
      unique_identifier: claimData.unique_identifier,
      lost_place_time: claimData.lost_place_time,
      proof_url: claimData.proof_url,
      additional_notes: claimData.additional_notes,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setClaims((prev) => [newClaim, ...prev]);

    // Update item status to claim_pending if it was found
    if (item.status === 'found' || item.status === 'lost') {
      updateItem(item.id, { status: 'claim_pending' });
    }

    addAuditLog('SUBMITTED_CLAIM', 'claim', newClaim.id, {
      item_id: item.id,
      item_title: item.title,
      claimant: currentUser.full_name,
    });

    // Notify item finder/owner and admins
    sendNotification(
      item.owner_id,
      'New Claim Submitted!',
      `${currentUser.full_name} submitted an ownership claim for "${item.title}". A campus moderator will review the verification details.`,
      'claim_submitted',
      item.id,
      newClaim.id
    );

    return { success: true, claim: newClaim };
  };

  // Review Claim
  const reviewClaim = async (
    claimId: string,
    status: ClaimStatus,
    reviewNotes: string,
    customHandoverLocation?: string
  ): Promise<boolean> => {
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) return false;

    const item = items.find((i) => i.id === claim.item_id);

    const updatedClaim: Claim = {
      ...claim,
      status,
      reviewed_by: currentUser?.id,
      reviewer_name: currentUser?.full_name || 'Campus Moderator',
      review_notes: reviewNotes,
      reviewed_at: new Date().toISOString(),
    };

    setClaims((prev) => prev.map((c) => (c.id === claimId ? updatedClaim : c)));

    addAuditLog(`CLAIM_${status.toUpperCase()}`, 'claim', claimId, {
      status,
      reviewer: currentUser?.full_name,
      notes: reviewNotes,
    });

    if (status === 'approved') {
      // If approved, update item to claim_approved / handover_pending
      if (item) {
        updateItem(item.id, { status: 'claim_approved' });
      }

      // Automatically generate a Handover record for safe campus pickup
      const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
      const newHandover: Handover = {
        id: `handover-${Date.now()}`,
        item_id: claim.item_id,
        item_title: claim.item_title || (item?.title ?? 'Recovered Item'),
        claim_id: claim.id,
        claimant_id: claim.claimant_id,
        claimant_name: claim.claimant_name,
        claimant_email: claim.claimant_email,
        finder_id: item?.owner_id || 'campus-security',
        finder_name: item?.owner_name || 'Campus Security & Lost/Found Desk',
        handover_location:
          customHandoverLocation ||
          item?.current_holding_location ||
          'Campus Public Safety Central Desk (Admin Annex 102)',
        security_desk_name: 'Campus Public Safety Official',
        verification_pin: randomPin,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'scheduled',
        notes: reviewNotes || 'Claim verified by campus staff. Please present student ID and verification PIN on pickup.',
        created_at: new Date().toISOString(),
      };

      setHandovers((prev) => [newHandover, ...prev]);

      // Notify claimant with PIN
      sendNotification(
        claim.claimant_id,
        'Claim Approved! Handover Scheduled',
        `Your claim for "${claim.item_title}" was APPROVED. Your pickup PIN is ${randomPin}. Please pick up your item at the security desk.`,
        'claim_approved',
        claim.item_id,
        claim.id
      );

      // Notify finder/custodian
      if (item) {
        sendNotification(
          item.owner_id,
          'Claim Approved for Handover',
          `Ownership verified for "${item.title}". Item pickup has been scheduled at the designated campus desk.`,
          'handover_scheduled',
          item.id
        );
      }
    } else if (status === 'rejected') {
      // Revert item status if no other approved claims
      if (item) {
        updateItem(item.id, { status: item.type === 'lost' ? 'lost' : 'found' });
      }

      sendNotification(
        claim.claimant_id,
        'Claim Status Update',
        `Your claim for "${claim.item_title}" could not be verified: ${reviewNotes || 'Distinguishing features did not match.'}`,
        'claim_rejected',
        claim.item_id,
        claim.id
      );
    }

    return true;
  };

  const getClaimsForItem = (itemId: string): Claim[] => {
    return claims.filter((c) => c.item_id === itemId);
  };

  const getUserClaims = (userId: string): Claim[] => {
    return claims.filter((c) => c.claimant_id === userId);
  };

  const getItemMatches = (itemId: string): ItemMatch[] => {
    const targetItem = items.find((i) => i.id === itemId);
    if (!targetItem) return [];

    // Hydrate matches with current item data
    return matches
      .filter((m) => m.lost_item_id === itemId || m.found_item_id === itemId)
      .map((m) => ({
        ...m,
        lost_item: items.find((i) => i.id === m.lost_item_id),
        found_item: items.find((i) => i.id === m.found_item_id),
      }));
  };

  const getUserMatches = (userId: string): ItemMatch[] => {
    const userItemIds = new Set(items.filter((i) => i.owner_id === userId).map((i) => i.id));
    return matches
      .filter((m) => userItemIds.has(m.lost_item_id) || userItemIds.has(m.found_item_id))
      .map((m) => ({
        ...m,
        lost_item: items.find((i) => i.id === m.lost_item_id),
        found_item: items.find((i) => i.id === m.found_item_id),
      }));
  };

  const dismissMatch = (matchId: string) => {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: 'dismissed' } : m)));
  };

  // Schedule Handover
  const scheduleHandover = async (handoverData: {
    item_id: string;
    claim_id: string;
    claimant_id: string;
    claimant_name: string;
    claimant_email: string;
    handover_location: string;
    security_desk_name?: string;
    scheduled_at?: string;
    notes?: string;
  }): Promise<Handover> => {
    const item = items.find((i) => i.id === handoverData.item_id);
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    const newHandover: Handover = {
      id: `handover-${Date.now()}`,
      item_id: handoverData.item_id,
      item_title: item?.title || 'Campus Item',
      claim_id: handoverData.claim_id,
      claimant_id: handoverData.claimant_id,
      claimant_name: handoverData.claimant_name,
      claimant_email: handoverData.claimant_email,
      finder_id: item?.owner_id || 'campus-security',
      finder_name: item?.owner_name || 'Campus Finder',
      handover_location: handoverData.handover_location,
      security_desk_name: handoverData.security_desk_name,
      verification_pin: pin,
      scheduled_at: handoverData.scheduled_at,
      status: 'scheduled',
      notes: handoverData.notes,
      created_at: new Date().toISOString(),
    };

    setHandovers((prev) => [newHandover, ...prev]);

    if (item) {
      updateItem(item.id, { status: 'handover_pending' });
    }

    addAuditLog('SCHEDULED_HANDOVER', 'handover', newHandover.id, {
      location: handoverData.handover_location,
      claimant: handoverData.claimant_name,
    });

    return newHandover;
  };

  // Complete Handover (Verification by Security Officer or Admin using PIN)
  const completeHandover = async (
    handoverId: string,
    enteredPin: string
  ): Promise<{ success: boolean; error?: string }> => {
    const handover = handovers.find((h) => h.id === handoverId);
    if (!handover) {
      return { success: false, error: 'Handover record not found.' };
    }

    if (handover.verification_pin !== enteredPin.trim()) {
      return { success: false, error: 'Invalid verification PIN. Please verify with the claimant.' };
    }

    const updatedHandover: Handover = {
      ...handover,
      status: 'completed',
      completed_at: new Date().toISOString(),
      verified_by_admin: true,
    };

    setHandovers((prev) => prev.map((h) => (h.id === handoverId ? updatedHandover : h)));

    // Mark item as Recovered!
    updateItem(handover.item_id, { status: 'recovered' });

    addAuditLog('COMPLETED_HANDOVER_RECOVERED', 'handover', handoverId, {
      item_id: handover.item_id,
      claimant_name: handover.claimant_name,
    });

    // Send celebration notification to claimant and finder
    sendNotification(
      handover.claimant_id,
      '🎉 Item Handover Completed!',
      `Your item "${handover.item_title}" has been successfully recovered. Thank you for using Campus Lost & Found!`,
      'item_recovered',
      handover.item_id
    );

    sendNotification(
      handover.finder_id,
      'Item Successfully Returned to Owner',
      `"${handover.item_title}" was safely handed over to its owner ${handover.claimant_name}. Great job!`,
      'item_recovered',
      handover.item_id
    );

    return { success: true };
  };

  // Notifications
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.user_id === currentUser.id ? { ...n, is_read: true } : n))
    );
  };

  const clearNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  // Saved items
  const toggleSaveItem = (itemId: string): boolean => {
    if (!currentUser) return false;

    const exists = savedItems.some((s) => s.user_id === currentUser.id && s.item_id === itemId);

    if (exists) {
      setSavedItems((prev) => prev.filter((s) => !(s.user_id === currentUser.id && s.item_id === itemId)));
      return false; // un-saved
    } else {
      const newSaved: SavedItem = {
        id: `save-${Date.now()}`,
        user_id: currentUser.id,
        item_id: itemId,
        created_at: new Date().toISOString(),
      };
      setSavedItems((prev) => [newSaved, ...prev]);
      return true; // saved
    }
  };

  const isItemSaved = (itemId: string): boolean => {
    if (!currentUser) return false;
    return savedItems.some((s) => s.user_id === currentUser.id && s.item_id === itemId);
  };

  const getUserSavedItems = (): Item[] => {
    if (!currentUser) return [];
    const savedIds = new Set(savedItems.filter((s) => s.user_id === currentUser.id).map((s) => s.item_id));
    return items.filter((i) => savedIds.has(i.id));
  };

  // Abuse Reports
  const reportAbuse = async (reportData: {
    item_id: string;
    item_title: string;
    reason: ReportAbuse['reason'];
    description: string;
  }): Promise<boolean> => {
    if (!currentUser) return false;
    const newReport: ReportAbuse = {
      id: `report-${Date.now()}`,
      reporter_id: currentUser.id,
      reporter_name: currentUser.full_name,
      item_id: reportData.item_id,
      item_title: reportData.item_title,
      reason: reportData.reason,
      description: reportData.description,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setReports((prev) => [newReport, ...prev]);
    addAuditLog('REPORTED_ABUSE_LISTING', 'report', newReport.id, {
      item_id: reportData.item_id,
      reason: reportData.reason,
    });
    return true;
  };

  const resolveReport = async (reportId: string, status: ReportAbuse['status']): Promise<boolean> => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId ? { ...r, status, reviewed_by: currentUser?.id } : r
      )
    );
    addAuditLog('RESOLVED_ABUSE_REPORT', 'report', reportId, { status });
    return true;
  };

  // Admin moderation
  const adminModerateItem = async (
    itemId: string,
    action: 'approve' | 'reject' | 'close' | 'delete'
  ): Promise<boolean> => {
    if (action === 'delete') {
      return deleteItem(itemId);
    }
    const statusMap: Record<string, ItemStatus> = {
      approve: 'lost', // or existing type
      reject: 'rejected',
      close: 'closed',
    };
    const item = items.find((i) => i.id === itemId);
    if (!item) return false;

    let targetStatus: ItemStatus = item.type;
    if (action === 'reject') targetStatus = 'rejected';
    if (action === 'close') targetStatus = 'closed';

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              status: targetStatus,
              is_approved: action === 'approve',
              updated_at: new Date().toISOString(),
            }
          : i
      )
    );
    addAuditLog(`ADMIN_${action.toUpperCase()}_ITEM`, 'item', itemId, { action });
    return true;
  };

  const addCategory = (category: Category) => {
    setCategories((prev) => [...prev, category]);
    addAuditLog('ADDED_CATEGORY', 'category', category.id, { name: category.name });
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addAuditLog('UPDATED_CATEGORY', 'category', id, updates);
  };

  const addLocation = (location: CampusLocation) => {
    setLocations((prev) => [...prev, location]);
    addAuditLog('ADDED_LOCATION', 'location', location.id, { name: location.name });
  };

  const updateLocation = (id: string, updates: Partial<CampusLocation>) => {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    addAuditLog('UPDATED_LOCATION', 'location', id, updates);
  };

  return (
    <DataContext.Provider
      value={{
        items,
        claims,
        matches,
        handovers,
        notifications,
        savedItems,
        reports,
        categories,
        locations,
        auditLogs,
        unreadNotificationCount,
        createItem,
        updateItem,
        deleteItem,
        incrementItemViews,
        getItemById,
        filterItems,
        submitClaim,
        reviewClaim,
        getClaimsForItem,
        getUserClaims,
        getItemMatches,
        getUserMatches,
        dismissMatch,
        scheduleHandover,
        completeHandover,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotification,
        toggleSaveItem,
        isItemSaved,
        getUserSavedItems,
        reportAbuse,
        resolveReport,
        abuseReports: reports,
        resolveAbuseReport: resolveReport,
        updateItemStatus: (id: string, status: ItemStatus) => updateItem(id, { status }),
        adminModerateItem,
        addCategory,
        updateCategory,
        addLocation,
        updateLocation,
        addAuditLog,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
