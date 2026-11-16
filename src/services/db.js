/**
 * src/services/db.js
 * Simulated Relational Database Data Layer backed by browser localStorage.
 *
 * Every UI component and helper communicates strictly with this module—never
 * directly with localStorage—so the entire persistence layer can later be
 * swapped for REST API calls without altering any React component.
 */

export const STORAGE_KEYS = {
  users: 'campus_users',
  categories: 'campus_categories',
  locations: 'campus_locations',
  items: 'campus_items',
  claims: 'campus_claims',
  session: 'campus_session',
  meta: 'campus_meta',
};

const TABLE_CONFIG = {
  users: { key: STORAGE_KEYS.users, pk: 'user_id' },
  categories: { key: STORAGE_KEYS.categories, pk: 'category_id' },
  locations: { key: STORAGE_KEYS.locations, pk: 'location_id' },
  items: { key: STORAGE_KEYS.items, pk: 'item_id' },
  claims: { key: STORAGE_KEYS.claims, pk: 'claim_id' },
};

const VALID_ROLES = ['student', 'faculty', 'admin'];
const VALID_ITEM_TYPES = ['lost', 'found'];
const VALID_ITEM_STATUSES = ['Open', 'Claimed', 'Returned'];
const VALID_CLAIM_STATUSES = ['Pending', 'Approved', 'Rejected'];

/**
 * Schema metadata used by the Admin Database Viewer to render PK/FK badges.
 */
export const SCHEMA_METADATA = {
  users: {
    storageKey: STORAGE_KEYS.users,
    columns: [
      { name: 'user_id', badge: 'PK' },
      { name: 'name' },
      { name: 'email', badge: 'UNIQUE' },
      { name: 'password' },
      { name: 'role' },
      { name: 'created_at' },
    ],
  },
  categories: {
    storageKey: STORAGE_KEYS.categories,
    columns: [
      { name: 'category_id', badge: 'PK' },
      { name: 'category_name', badge: 'UNIQUE' },
    ],
  },
  locations: {
    storageKey: STORAGE_KEYS.locations,
    columns: [
      { name: 'location_id', badge: 'PK' },
      { name: 'location_name', badge: 'UNIQUE' },
    ],
  },
  items: {
    storageKey: STORAGE_KEYS.items,
    columns: [
      { name: 'item_id', badge: 'PK' },
      { name: 'user_id', badge: 'FK -> users' },
      { name: 'category_id', badge: 'FK -> categories' },
      { name: 'location_id', badge: 'FK -> locations' },
      { name: 'title' },
      { name: 'description' },
      { name: 'type' },
      { name: 'date' },
      { name: 'status' },
      { name: 'image' },
      { name: 'created_at' },
    ],
  },
  claims: {
    storageKey: STORAGE_KEYS.claims,
    columns: [
      { name: 'claim_id', badge: 'PK' },
      { name: 'item_id', badge: 'FK -> items' },
      { name: 'user_id', badge: 'FK -> users' },
      { name: 'proof_description' },
      { name: 'status' },
      { name: 'created_at' },
    ],
  },
};

function getLocalTodayYYYYMMDD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateDaysAgo(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() - days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getISODaysAgo(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() - days);
  return dt.toISOString();
}

function readRaw(key) {
  const raw = window.localStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    const isQuotaError =
      err &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22 ||
        err.code === 1014 ||
        /quota/i.test(String(err.message || '')));
    if (isQuotaError) {
      throw new Error('Storage full. Remove some item photos or reset demo data.');
    }
    throw new Error('Unable to save changes to browser storage.');
  }
}

function assertTable(table) {
  if (!TABLE_CONFIG[table]) {
    throw new Error(`Unknown database table "${table}".`);
  }
  return TABLE_CONFIG[table];
}

function readTable(table) {
  const { key } = assertTable(table);
  const rows = readRaw(key);
  return Array.isArray(rows) ? rows : [];
}

function writeTable(table, rows) {
  const { key } = assertTable(table);
  writeRaw(key, rows);
}

function readMeta() {
  const meta = readRaw(STORAGE_KEYS.meta);
  if (meta && typeof meta === 'object' && meta.counters) {
    return meta;
  }
  return {
    initialized: false,
    counters: {
      users: 0,
      categories: 0,
      locations: 0,
      items: 0,
      claims: 0,
    },
  };
}

function writeMeta(meta) {
  writeRaw(STORAGE_KEYS.meta, meta);
}

function nextId(table) {
  const meta = readMeta();
  const current = Number(meta.counters[table] || 0);
  const next = current + 1;
  meta.counters[table] = next;
  writeMeta(meta);
  return next;
}

function buildSeedData() {
  const users = [
    {
      user_id: 1,
      name: 'Dr. Ananya Sharma',
      email: 'admin@campus.com',
      password: 'admin123',
      role: 'admin',
      created_at: getISODaysAgo(30),
    },
    {
      user_id: 2,
      name: 'Rohan Verma',
      email: 'student@campus.com',
      password: 'student123',
      role: 'student',
      created_at: getISODaysAgo(22),
    },
    {
      user_id: 3,
      name: 'Prof. Vikram Kulkarni',
      email: 'faculty@campus.com',
      password: 'faculty123',
      role: 'faculty',
      created_at: getISODaysAgo(18),
    },
  ];

  const categories = [
    { category_id: 1, category_name: 'Electronics' },
    { category_id: 2, category_name: 'Documents' },
    { category_id: 3, category_name: 'Keys' },
    { category_id: 4, category_name: 'Accessories' },
    { category_id: 5, category_name: 'Clothing' },
  ];

  const locations = [
    { location_id: 1, location_name: 'Library' },
    { location_id: 2, location_name: 'Canteen' },
    { location_id: 3, location_name: 'Main Block' },
    { location_id: 4, location_name: 'Hostel' },
    { location_id: 5, location_name: 'Sports Ground' },
    { location_id: 6, location_name: 'Parking' },
  ];

  const items = [
    {
      item_id: 1,
      user_id: 3,
      category_id: 1,
      location_id: 1,
      title: 'Apple AirPods Pro (2nd Gen)',
      description:
        'Found a white MagSafe charging case with both earbuds near the second-floor silent reading desks in Central Library.',
      type: 'found',
      date: getDateDaysAgo(2),
      status: 'Open',
      image: '',
      created_at: getISODaysAgo(2),
    },
    {
      item_id: 2,
      user_id: 2,
      category_id: 2,
      location_id: 3,
      title: 'DBMS Lab Record & Campus ID Card',
      description:
        'Blue spiral-bound Semester V DBMS Lab manual along with student smart ID card inside a transparent sleeve.',
      type: 'lost',
      date: getDateDaysAgo(3),
      status: 'Open',
      image: '',
      created_at: getISODaysAgo(3),
    },
    {
      item_id: 3,
      user_id: 3,
      category_id: 3,
      location_id: 6,
      title: 'Honda Scooter Key with Red Lanyard',
      description:
        'Found near the North Gate student parking shed attached to a woven red fabric tag and a small brass locker key.',
      type: 'found',
      date: getDateDaysAgo(6),
      status: 'Claimed',
      image: '',
      created_at: getISODaysAgo(6),
    },
    {
      item_id: 4,
      user_id: 1,
      category_id: 4,
      location_id: 2,
      title: 'Casio Scientific Calculator fx-991EX',
      description:
        'Black ClassWiz calculator left on table #4 near the north billing counter after the afternoon break.',
      type: 'found',
      date: getDateDaysAgo(10),
      status: 'Returned',
      image: '',
      created_at: getISODaysAgo(10),
    },
    {
      item_id: 5,
      user_id: 2,
      category_id: 5,
      location_id: 5,
      title: 'Navy Campus Athletics Windbreaker',
      description:
        'Size M zip-up navy windbreaker jacket left on the concrete bleachers during evening football practice.',
      type: 'lost',
      date: getDateDaysAgo(9),
      status: 'Returned',
      image: '',
      created_at: getISODaysAgo(9),
    },
    {
      item_id: 6,
      user_id: 1,
      category_id: 2,
      location_id: 4,
      title: 'SBI Debit Card & Metro Smart Pass',
      description:
        'Turned in at the Hostel B-wing warden office inside a slim matte black leather cardholder.',
      type: 'found',
      date: getDateDaysAgo(1),
      status: 'Open',
      image: '',
      created_at: getISODaysAgo(1),
    },
    {
      item_id: 7,
      user_id: 3,
      category_id: 4,
      location_id: 3,
      title: 'Ray-Ban Prescription Eyeglasses',
      description:
        'Tortoiseshell optical frames inside a brown hard-shell case, misplaced near Seminar Hall 2.',
      type: 'lost',
      date: getDateDaysAgo(4),
      status: 'Open',
      image: '',
      created_at: getISODaysAgo(4),
    },
    {
      item_id: 8,
      user_id: 2,
      category_id: 1,
      location_id: 2,
      title: 'SanDisk 64GB Dual USB-C Flash Drive',
      description:
        'Silver swivel USB-C/USB-A pen drive found plugged into the canteen print kiosk terminal.',
      type: 'found',
      date: getDateDaysAgo(1),
      status: 'Open',
      image: '',
      created_at: getISODaysAgo(1),
    },
  ];

  const claims = [
    {
      claim_id: 1,
      item_id: 1,
      user_id: 2,
      proof_description:
        'There is a tiny scratch right next to the rear pairing button, and the Bluetooth name shows as "Rohan-Pods".',
      status: 'Pending',
      created_at: getISODaysAgo(1),
    },
    {
      claim_id: 2,
      item_id: 3,
      user_id: 2,
      proof_description:
        'The woven red lanyard has initials "RV" written on the inner tag and holds my Hostel Room 204 locker key.',
      status: 'Approved',
      created_at: getISODaysAgo(5),
    },
    {
      claim_id: 3,
      item_id: 4,
      user_id: 2,
      proof_description:
        'My roll number CS-504 is marked in silver ink on the inside of the sliding protective cover.',
      status: 'Approved',
      created_at: getISODaysAgo(9),
    },
    {
      claim_id: 4,
      item_id: 6,
      user_id: 3,
      proof_description:
        'Matte black cardholder holds my Metro smart card ending in 8412 along with a faculty library slip.',
      status: 'Pending',
      created_at: getISODaysAgo(0),
    },
  ];

  const meta = {
    initialized: true,
    counters: {
      users: 3,
      categories: 5,
      locations: 6,
      items: 8,
      claims: 4,
    },
  };

  return { users, categories, locations, items, claims, meta };
}

function validateUserRecord(candidate, existingUsers, excludeId = null) {
  const name = String(candidate.name || '').trim();
  const email = String(candidate.email || '').trim().toLowerCase();
  const password = String(candidate.password || '');
  const role = String(candidate.role || '').trim();

  if (!name) throw new Error('User name is required.');
  if (!email) throw new Error('Email address is required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!VALID_ROLES.includes(role)) {
    throw new Error(`Invalid role "${role}". Allowed roles: ${VALID_ROLES.join(', ')}.`);
  }

  const duplicate = existingUsers.find(
    (u) => u.email.toLowerCase() === email && u.user_id !== excludeId
  );
  if (duplicate) {
    throw new Error(`An account with email "${email}" already exists.`);
  }

  return {
    ...candidate,
    name,
    email,
    password,
    role,
  };
}

function validateCategoryRecord(candidate, existingCategories, excludeId = null) {
  const categoryName = String(candidate.category_name || '').trim();
  if (!categoryName) {
    throw new Error('Category name is required.');
  }
  const duplicate = existingCategories.find(
    (c) =>
      c.category_name.toLowerCase() === categoryName.toLowerCase() &&
      c.category_id !== excludeId
  );
  if (duplicate) {
    throw new Error(`Category "${categoryName}" already exists.`);
  }
  return { ...candidate, category_name: categoryName };
}

function validateLocationRecord(candidate, existingLocations, excludeId = null) {
  const locationName = String(candidate.location_name || '').trim();
  if (!locationName) {
    throw new Error('Location name is required.');
  }
  const duplicate = existingLocations.find(
    (l) =>
      l.location_name.toLowerCase() === locationName.toLowerCase() &&
      l.location_id !== excludeId
  );
  if (duplicate) {
    throw new Error(`Location "${locationName}" already exists.`);
  }
  return { ...candidate, location_name: locationName };
}

function validateItemRecord(candidate) {
  const title = String(candidate.title || '').trim();
  const description = String(candidate.description || '').trim();
  const userId = Number(candidate.user_id);
  const categoryId = Number(candidate.category_id);
  const locationId = Number(candidate.location_id);
  const type = String(candidate.type || '').trim();
  const status = String(candidate.status || '').trim();
  const date = String(candidate.date || '').trim();

  if (!title) throw new Error('Item title is required.');
  if (!description) throw new Error('Item description is required.');
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('A valid user_id is required.');
  }
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new Error('Please select a valid category.');
  }
  if (!Number.isInteger(locationId) || locationId <= 0) {
    throw new Error('Please select a valid location.');
  }
  if (!VALID_ITEM_TYPES.includes(type)) {
    throw new Error(`Invalid item type "${type}". Must be "lost" or "found".`);
  }
  if (!VALID_ITEM_STATUSES.includes(status)) {
    throw new Error(
      `Invalid item status "${status}". Must be one of: ${VALID_ITEM_STATUSES.join(', ')}.`
    );
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Please provide a valid date in YYYY-MM-DD format.');
  }
  if (date > getLocalTodayYYYYMMDD()) {
    throw new Error('Item date cannot be in the future.');
  }

  // Foreign key integrity checks
  const users = readTable('users');
  const categories = readTable('categories');
  const locations = readTable('locations');

  if (!users.some((u) => u.user_id === userId)) {
    throw new Error(`Foreign key constraint failed: user_id ${userId} does not exist.`);
  }
  if (!categories.some((c) => c.category_id === categoryId)) {
    throw new Error(`Foreign key constraint failed: category_id ${categoryId} does not exist.`);
  }
  if (!locations.some((l) => l.location_id === locationId)) {
    throw new Error(`Foreign key constraint failed: location_id ${locationId} does not exist.`);
  }

  const image = candidate.image ? String(candidate.image) : '';
  if (image && !image.startsWith('data:image/')) {
    throw new Error('Item photo must be a valid compressed image.');
  }

  return {
    ...candidate,
    user_id: userId,
    category_id: categoryId,
    location_id: locationId,
    title,
    description,
    type,
    date,
    status,
    image,
  };
}

function validateClaimRecord(candidate, isInsert) {
  const itemId = Number(candidate.item_id);
  const userId = Number(candidate.user_id);
  const proof = String(candidate.proof_description || '').trim();
  const status = String(candidate.status || 'Pending').trim();

  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error('A valid item_id is required.');
  }
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('A valid user_id is required.');
  }
  if (!proof) {
    throw new Error('Proof description is required to submit a claim.');
  }
  if (!VALID_CLAIM_STATUSES.includes(status)) {
    throw new Error(
      `Invalid claim status "${status}". Must be one of: ${VALID_CLAIM_STATUSES.join(', ')}.`
    );
  }

  const items = readTable('items');
  const users = readTable('users');
  const claims = readTable('claims');

  const item = items.find((i) => i.item_id === itemId);
  if (!item) {
    throw new Error(`Foreign key constraint failed: item_id ${itemId} does not exist.`);
  }
  if (!users.some((u) => u.user_id === userId)) {
    throw new Error(`Foreign key constraint failed: user_id ${userId} does not exist.`);
  }

  if (isInsert) {
    if (item.user_id === userId) {
      throw new Error('You cannot submit a claim on an item you posted.');
    }
    if (item.type !== 'found') {
      throw new Error('Claims can only be submitted on Found items.');
    }
    if (item.status !== 'Open') {
      throw new Error(`Claims are closed because this item is currently ${item.status}.`);
    }
    const hasPending = claims.some(
      (c) => c.item_id === itemId && c.user_id === userId && c.status === 'Pending'
    );
    if (hasPending) {
      throw new Error('You already have a Pending claim for this item.');
    }
  }

  return {
    ...candidate,
    item_id: itemId,
    user_id: userId,
    proof_description: proof,
    status,
  };
}

/**
 * Seeds the database ONLY if uninitialized or empty.
 * Real API equivalent: Server-side database migration/seed script on startup.
 */
export function initializeDatabase() {
  const meta = readRaw(STORAGE_KEYS.meta);
  const existingUsers = readRaw(STORAGE_KEYS.users);

  if (
    meta &&
    meta.initialized === true &&
    Array.isArray(existingUsers) &&
    existingUsers.length > 0
  ) {
    return;
  }

  const seed = buildSeedData();
  writeRaw(STORAGE_KEYS.users, seed.users);
  writeRaw(STORAGE_KEYS.categories, seed.categories);
  writeRaw(STORAGE_KEYS.locations, seed.locations);
  writeRaw(STORAGE_KEYS.items, seed.items);
  writeRaw(STORAGE_KEYS.claims, seed.claims);
  writeRaw(STORAGE_KEYS.meta, seed.meta);
}

/**
 * Restores all tables and auto-increment counters back to the initial demo seed.
 * Real API equivalent: POST /api/admin/reset-demo
 */
export function resetDatabase() {
  const seed = buildSeedData();
  writeRaw(STORAGE_KEYS.users, seed.users);
  writeRaw(STORAGE_KEYS.categories, seed.categories);
  writeRaw(STORAGE_KEYS.locations, seed.locations);
  writeRaw(STORAGE_KEYS.items, seed.items);
  writeRaw(STORAGE_KEYS.claims, seed.claims);
  writeRaw(STORAGE_KEYS.meta, seed.meta);

  // Preserve an active admin session if valid after reset, otherwise keep seed admin
  const currentSession = getSession();
  if (currentSession) {
    const stillAdmin = seed.users.find(
      (u) => u.user_id === currentSession.user_id && u.role === 'admin'
    );
    if (!stillAdmin) {
      setSession(1);
    }
  }
}

/**
 * Returns all rows from the requested table.
 * Real API equivalent: GET /api/{table}
 */
export function getAll(table) {
  initializeDatabase();
  return readTable(table).map((row) => ({ ...row }));
}

/**
 * Returns a single row by its primary key, or null if not found.
 * Real API equivalent: GET /api/{table}/{id}
 */
export function getById(table, id) {
  initializeDatabase();
  const { pk } = assertTable(table);
  const numericId = Number(id);
  const row = readTable(table).find((r) => r[pk] === numericId);
  return row ? { ...row } : null;
}

/**
 * Inserts a validated row with an auto-incremented sequential primary key.
 * Real API equivalent: POST /api/{table}
 */
export function insert(table, row) {
  initializeDatabase();
  const { pk } = assertTable(table);
  const existing = readTable(table);
  const nowISO = new Date().toISOString();

  let validated;
  if (table === 'users') {
    validated = validateUserRecord({ ...row, created_at: row.created_at || nowISO }, existing);
  } else if (table === 'categories') {
    validated = validateCategoryRecord(row, existing);
  } else if (table === 'locations') {
    validated = validateLocationRecord(row, existing);
  } else if (table === 'items') {
    validated = validateItemRecord({
      ...row,
      status: row.status || 'Open',
      created_at: row.created_at || nowISO,
    });
  } else if (table === 'claims') {
    validated = validateClaimRecord(
      {
        ...row,
        status: row.status || 'Pending',
        created_at: row.created_at || nowISO,
      },
      true
    );
  }

  const newId = nextId(table);
  const record = { ...validated, [pk]: newId };
  const updated = [...existing, record];
  writeTable(table, updated);
  return { ...record };
}

/**
 * Updates an existing row by primary key while enforcing schema & FK integrity.
 * Real API equivalent: PATCH /api/{table}/{id}
 */
export function update(table, id, changes) {
  initializeDatabase();
  const { pk } = assertTable(table);
  const numericId = Number(id);
  const existing = readTable(table);
  const index = existing.findIndex((r) => r[pk] === numericId);

  if (index === -1) {
    throw new Error(`Record with ${pk}=${numericId} not found in "${table}".`);
  }

  const currentRow = existing[index];
  const merged = { ...currentRow, ...changes, [pk]: numericId };

  let validated;
  if (table === 'users') {
    const session = getSession();
    if (
      session &&
      session.user_id === numericId &&
      currentRow.role === 'admin' &&
      merged.role !== 'admin'
    ) {
      throw new Error('Administrators cannot demote their own active account.');
    }
    validated = validateUserRecord(merged, existing, numericId);
  } else if (table === 'categories') {
    validated = validateCategoryRecord(merged, existing, numericId);
  } else if (table === 'locations') {
    validated = validateLocationRecord(merged, existing, numericId);
  } else if (table === 'items') {
    // Returned items cannot be edited
    if (currentRow.status === 'Returned') {
      throw new Error('Returned items are finalized and cannot be edited.');
    }
    validated = validateItemRecord(merged);
  } else if (table === 'claims') {
    validated = validateClaimRecord(merged, false);
  }

  const updated = [...existing];
  updated[index] = validated;
  writeTable(table, updated);
  return { ...validated };
}

/**
 * Deletes a row by primary key, enforcing RESTRICT and CASCADE integrity rules.
 * Real API equivalent: DELETE /api/{table}/{id}
 */
export function remove(table, id) {
  initializeDatabase();
  const { pk } = assertTable(table);
  const numericId = Number(id);
  const existing = readTable(table);
  const target = existing.find((r) => r[pk] === numericId);

  if (!target) {
    throw new Error(`Record with ${pk}=${numericId} not found in "${table}".`);
  }

  if (table === 'categories') {
    const referencingItems = readTable('items').filter((i) => i.category_id === numericId);
    if (referencingItems.length > 0) {
      throw new Error(
        `Cannot delete category "${target.category_name}": ${referencingItems.length} item(s) still reference it (RESTRICT).`
      );
    }
  }

  if (table === 'locations') {
    const referencingItems = readTable('items').filter((i) => i.location_id === numericId);
    if (referencingItems.length > 0) {
      throw new Error(
        `Cannot delete location "${target.location_name}": ${referencingItems.length} item(s) still reference it (RESTRICT).`
      );
    }
  }

  if (table === 'users') {
    const session = getSession();
    if (session && session.user_id === numericId) {
      throw new Error('You cannot delete your own currently logged-in account.');
    }
    const ownedItems = readTable('items').filter((i) => i.user_id === numericId);
    const ownedClaims = readTable('claims').filter((c) => c.user_id === numericId);
    if (ownedItems.length > 0 || ownedClaims.length > 0) {
      throw new Error(
        `Cannot delete user "${target.name}": user has ${ownedItems.length} item(s) and ${ownedClaims.length} claim(s) (RESTRICT).`
      );
    }
  }

  if (table === 'items') {
    // CASCADE delete: deleting an item automatically deletes all its claims
    const claims = readTable('claims');
    const remainingClaims = claims.filter((c) => c.item_id !== numericId);
    if (remainingClaims.length !== claims.length) {
      writeTable('claims', remainingClaims);
    }
  }

  const remaining = existing.filter((r) => r[pk] !== numericId);
  writeTable(table, remaining);
  return { deleted: true, [pk]: numericId };
}

/**
 * Atomic transaction: Approves one Pending claim, sets item status Open -> Claimed,
 * and auto-rejects all other Pending claims on that item.
 * Real API equivalent: POST /api/claims/{claimId}/approve
 */
export function approveClaim(claimId) {
  initializeDatabase();
  const numericClaimId = Number(claimId);
  const claims = readTable('claims');
  const items = readTable('items');

  const claimIndex = claims.findIndex((c) => c.claim_id === numericClaimId);
  if (claimIndex === -1) {
    throw new Error(`Claim #${numericClaimId} was not found.`);
  }
  const targetClaim = claims[claimIndex];
  if (targetClaim.status !== 'Pending') {
    throw new Error(`Only Pending claims can be approved (current status: ${targetClaim.status}).`);
  }

  const itemIndex = items.findIndex((i) => i.item_id === targetClaim.item_id);
  if (itemIndex === -1) {
    throw new Error(`Referenced item #${targetClaim.item_id} does not exist.`);
  }
  const targetItem = items[itemIndex];
  if (targetItem.status !== 'Open') {
    throw new Error(`Cannot approve claim: item is currently ${targetItem.status}.`);
  }

  let autoRejectedCount = 0;
  const nextClaims = claims.map((c) => {
    if (c.claim_id === numericClaimId) {
      return { ...c, status: 'Approved' };
    }
    if (c.item_id === targetItem.item_id && c.status === 'Pending') {
      autoRejectedCount += 1;
      return { ...c, status: 'Rejected' };
    }
    return c;
  });

  const nextItems = items.map((i) =>
    i.item_id === targetItem.item_id ? { ...i, status: 'Claimed' } : i
  );

  writeTable('claims', nextClaims);
  writeTable('items', nextItems);

  return {
    claim: nextClaims[claimIndex],
    item: nextItems[itemIndex],
    autoRejectedCount,
  };
}

/**
 * Rejects a Pending claim while leaving the parent item Open.
 * Real API equivalent: POST /api/claims/{claimId}/reject
 */
export function rejectClaim(claimId) {
  initializeDatabase();
  const numericClaimId = Number(claimId);
  const claim = getById('claims', numericClaimId);
  if (!claim) {
    throw new Error(`Claim #${numericClaimId} was not found.`);
  }
  if (claim.status !== 'Pending') {
    throw new Error(`Only Pending claims can be rejected (current status: ${claim.status}).`);
  }
  return update('claims', numericClaimId, { status: 'Rejected' });
}

/**
 * Reads the current session (stores only user_id, never password).
 * Real API equivalent: GET /api/auth/session
 */
export function getSession() {
  const session = readRaw(STORAGE_KEYS.session);
  if (!session || typeof session !== 'object' || !session.user_id) {
    return null;
  }
  return { user_id: Number(session.user_id) };
}

/**
 * Persists the logged-in user_id to localStorage session.
 * Real API equivalent: POST /api/auth/login (sets HttpOnly session cookie)
 */
export function setSession(userId) {
  const numericId = Number(userId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('Invalid user_id for session.');
  }
  writeRaw(STORAGE_KEYS.session, { user_id: numericId });
}

/**
 * Clears the current session.
 * Real API equivalent: POST /api/auth/logout
 */
export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEYS.session);
}

/**
 * Reads auto-increment metadata for the Database Viewer.
 * Real API equivalent: GET /api/admin/db-meta
 */
export function getDatabaseMeta() {
  initializeDatabase();
  return readMeta();
}
