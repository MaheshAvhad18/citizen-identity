// Shared utilities for Secure Identity System

// Wait for app bootstrap before running page-specific JS
export function onReady(callback) {
  if (window.dbReady) {
    Promise.resolve(callback()).catch((e) => console.error(e));
  } else {
    window.onDbReady = () => Promise.resolve(callback()).catch((e) => console.error(e));
  }
}

async function apiJson(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    // Not authenticated: return to login page
    if (!window.location.pathname.endsWith('index.html')) {
      window.location.href = 'index.html';
    }
    throw new Error('Not authenticated');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.error ? data.error : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

// Cached current user info
let _currentUser = null;

export async function getCurrentUser() {
  if (_currentUser) return _currentUser;
  try {
    const data = await apiJson('/api/me');
    _currentUser = data.user || null;
    return _currentUser;
  } catch {
    return null;
  }
}

export async function getAccountId() {
  const user = await getCurrentUser();
  return user ? user.accountId : 1;
}

// Simple query and exec wrappers via backend (MySQL)
export async function query(sql, params = []) {
  const data = await apiJson('/api/sql/query', {
    method: 'POST',
    body: JSON.stringify({ sql, params }),
  });
  return data.rows || [];
}

export async function exec(sql, params = []) {
  return await apiJson('/api/sql/exec', {
    method: 'POST',
    body: JSON.stringify({ sql, params }),
  });
}

// DOM helpers
export function $(selector, root = document) {
  return root.querySelector(selector);
}

export function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

// Sidebar navigation active state
export function initSidebar() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  $all('.sidebar a').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.endsWith(current)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Toast notifications
export function showToast(message, type = 'success') {
  let container = $('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Modal helpers
export function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
  }
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
  }
}

// Generic table renderer
export function renderTable(containerId, columns, rows, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { rowActions } = options;

  let html = '<table class="data-table"><thead><tr>';
  for (const col of columns) {
    html += `<th>${col.label}</th>`;
  }
  if (rowActions && rowActions.length) {
    html += '<th>Actions</th>';
  }
  html += '</tr></thead><tbody>';

  if (!rows.length) {
    html += `<tr><td colspan="${columns.length + (rowActions && rowActions.length ? 1 : 0)}" class="empty-cell">No records found</td></tr>`;
  } else {
    rows.forEach(row => {
      html += '<tr>';
      columns.forEach(col => {
        const raw = row[col.key];
        const value = col.format ? col.format(raw, row) : raw ?? '';
        html += `<td>${value}</td>`;
      });
      if (rowActions && rowActions.length) {
        html += '<td class="actions-cell">';
        rowActions.forEach(action => {
          html += `<button class="btn btn-xs" data-action="${action.id}" data-row-id="${row[action.rowIdKey || 'id']}">${action.label}</button>`;
        });
        html += '</td>';
      }
      html += '</tr>';
    });
  }

  html += '</tbody></table>';
  container.innerHTML = html;

  if (rowActions && rowActions.length) {
    rowActions.forEach(action => {
      $all(`button[data-action="${action.id}"]`, container).forEach(btn => {
        btn.addEventListener('click', () => {
          const rowId = btn.getAttribute('data-row-id');
          const row = rows.find(r => String(r[action.rowIdKey || 'id']) === String(rowId));
          if (row) {
            action.onClick(row);
          }
        });
      });
    });
  }
}

// Status badge helper
export function badge(text) {
  const cls = String(text || '').toLowerCase();
  let variant = 'default';
  if (['active', 'success', 'verified', 'approved', 'sent'].includes(cls)) variant = 'success';
  else if (['pending', 'in progress'].includes(cls)) variant = 'warning';
  else if (['failed', 'rejected', 'blocked', 'expired', 'suspended'].includes(cls)) variant = 'danger';
  return `<span class="badge badge-${variant}">${text}</span>`;
}

// Simple storage usage percentage helper
export function storageUsage(usedMb, limitMb) {
  if (!limitMb) return 0;
  return Math.min(100, Math.round((usedMb / limitMb) * 100));
}

