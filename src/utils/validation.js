/**
 * src/utils/validation.js
 * Client-side form validation and formatting helpers.
 */

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(value) {
  if (!value) return '—';
  const parts = String(value).split('T')[0].split('-');
  if (parts.length === 3) {
    const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (!Number.isNaN(dt.getTime())) {
      return dt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!String(email || '').trim()) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!String(password || '')) {
    errors.password = 'Password is required.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRegisterForm({ name, email, password, confirmPassword, role }) {
  const errors = {};
  if (!String(name || '').trim()) {
    errors.name = 'Full name is required.';
  } else if (String(name).trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!String(email || '').trim()) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!['student', 'faculty'].includes(role)) {
    errors.role = 'Please choose Student or Faculty.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateItemForm({ title, description, category_id, location_id, date, type }) {
  const errors = {};
  if (!String(title || '').trim()) {
    errors.title = 'Item title is required.';
  } else if (String(title).trim().length < 3) {
    errors.title = 'Title should be at least 3 characters.';
  }

  if (!String(description || '').trim()) {
    errors.description = 'Description is required.';
  } else if (String(description).trim().length < 10) {
    errors.description = 'Please include at least 10 characters of identifying details.';
  }

  if (!category_id) {
    errors.category_id = 'Please select a category.';
  }

  if (!location_id) {
    errors.location_id = 'Please select a campus location.';
  }

  if (!date) {
    errors.date = 'Date is required.';
  } else if (date > getTodayDateString()) {
    errors.date = 'Date cannot be in the future.';
  }

  if (!['lost', 'found'].includes(type)) {
    errors.type = 'Please select Lost or Found.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateClaimForm({ proof_description }) {
  const errors = {};
  if (!String(proof_description || '').trim()) {
    errors.proof_description = 'Proof of ownership is required.';
  } else if (String(proof_description).trim().length < 10) {
    errors.proof_description =
      'Please provide at least 10 characters describing unique marks or contents.';
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateProfileForm({ name, email, password, confirmPassword }) {
  const errors = {};
  if (!String(name || '').trim()) {
    errors.name = 'Full name is required.';
  } else if (String(name).trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!String(email || '').trim()) {
    errors.email = 'Email address is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (password || confirmPassword) {
    if (!password || password.length < 6) {
      errors.password = 'New password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
