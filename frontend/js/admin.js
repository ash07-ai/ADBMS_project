// admin.js — Buffetly Admin Dashboard
const BASE = '/api';
const STATUS_COLORS = {
  pending: '#F4A94E',
  confirmed: '#66BB6A',
  cancelled: '#EF5350',
};
const TYPE_COLORS = ['#E8912D', '#7B1D3A', '#66BB6A', '#42A5F5', '#AB47BC', '#FFA726'];

let currentStatusFilter = 'all';
let searchTimer = null;

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadBookings();

  // Status filter pills
  document.querySelectorAll('.bookings-filter-bar .filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.bookings-filter-bar .filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentStatusFilter = pill.dataset.status;
      loadBookings();
    });
  });

  // Search
  document.getElementById('bookingSearch').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadBookings(e.target.value.trim()), 350);
  });
});

// ============================================================
// STATS / AGGREGATIONS
// ============================================================
async function loadStats() {
  try {
    const res = await fetch(`${BASE}/stats`);
    const { data } = await res.json();
    renderOverview(data.overview);
    renderTopRated(data.topRated);
    renderPriceByArea(data.avgPriceByArea);
    renderTypeDistribution(data.buffetTypeDistribution);
    renderCheapestHiTea(data.cheapestHiTea);
    renderCuisineChart(data.cuisinePopularity);
    renderBookingStatus(data.bookingStatusBreakdown, data.overview.totalBookings);
    renderPopularBooked(data.popularBookedTypes);
  } catch (err) {
    console.error('Stats load failed:', err);
  }
}

function renderOverview(o) {
  const items = [
    { num: o.totalRestaurants, label: 'Restaurants' },
    { num: o.totalBuffetSlots, label: 'Buffet Slots' },
    { num: o.totalReviews, label: 'Reviews' },
    { num: o.totalBookings, label: 'Reservations' },
  ];
  document.getElementById('overviewGrid').innerHTML = items.map(i => `
    <div class="overview-card">
      <div class="overview-num">${i.num}</div>
      <div class="overview-label">${i.label}</div>
    </div>
  `).join('');
}

function renderTopRated(list) {
  if (!list.length) {
    document.getElementById('topRatedList').innerHTML = `<p style="color:var(--muted);font-size:0.85rem">No data yet.</p>`;
    return;
  }
  document.getElementById('topRatedList').innerHTML = list.map((r, i) => `
    <div class="ranked-item">
      <div class="ranked-pos">${i + 1}</div>
      <div class="ranked-info">
        <div class="ranked-name">${r.name}</div>
        <div class="ranked-meta">${r.area} · ${r.review_count} reviews</div>
      </div>
      <div class="ranked-value">★ ${r.rating.toFixed(1)}</div>
    </div>
  `).join('');
}

function renderPriceByArea(list) {
  if (!list.length) {
    document.getElementById('priceByAreaChart').innerHTML = `<p style="color:var(--muted);font-size:0.85rem">No data yet.</p>`;
    return;
  }
  const max = Math.max(...list.map(a => a.avgPrice));
  document.getElementById('priceByAreaChart').innerHTML = list.map(a => `
    <div class="bar-row">
      <div class="bar-row-label">
        <span><strong>${a.area}</strong> · ${a.buffetCount} slots</span>
        <span>PKR ${a.avgPrice.toLocaleString()} avg</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(a.avgPrice / max) * 100}%"></div>
      </div>
    </div>
  `).join('');
}

function renderTypeDistribution(list) {
  if (!list.length) {
    document.getElementById('typeDistribution').innerHTML = `<p style="color:var(--muted);font-size:0.85rem">No data yet.</p>`;
    return;
  }
  const total = list.reduce((sum, t) => sum + t.count, 0);
  let cumulative = 0;
  const radius = 60, cx = 70, cy = 70, strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  const segments = list.map((t, i) => {
    const fraction = t.count / total;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const offset = circumference * (1 - cumulative);
    cumulative += fraction;
    return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none"
      stroke="${TYPE_COLORS[i % TYPE_COLORS.length]}" stroke-width="${strokeWidth}"
      stroke-dasharray="${dash} ${gap}" stroke-dashoffset="${offset}"
      transform="rotate(-90 ${cx} ${cy})" />`;
  }).join('');

  const svg = `
    <svg class="donut-svg" width="140" height="140" viewBox="0 0 140 140">
      ${segments}
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="Playfair Display, serif" font-weight="700" font-size="22" fill="var(--ink)">${total}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" fill="var(--muted)" letter-spacing="1">SLOTS</text>
    </svg>
  `;

  const legend = list.map((t, i) => `
    <div class="donut-legend-item">
      <span class="donut-dot" style="background:${TYPE_COLORS[i % TYPE_COLORS.length]}"></span>
      <span>${t.type}</span>
      <strong>${t.count} · PKR ${t.avgPrice.toLocaleString()}</strong>
    </div>
  `).join('');

  document.getElementById('typeDistribution').innerHTML = svg + `<div class="donut-legend">${legend}</div>`;
}

function renderCheapestHiTea(list) {
  if (!list.length) {
    document.getElementById('cheapestHiTea').innerHTML = `<p style="color:var(--muted);font-size:0.85rem">No Hi-Tea data found.</p>`;
    return;
  }
  document.getElementById('cheapestHiTea').innerHTML = list.map((r, i) => `
    <div class="ranked-item">
      <div class="ranked-pos">${i + 1}</div>
      <div class="ranked-info">
        <div class="ranked-name">${r.name}</div>
        <div class="ranked-meta">${r.area}</div>
      </div>
      <div class="ranked-value">PKR ${r.price.toLocaleString()}</div>
    </div>
  `).join('');
}

function renderCuisineChart(list) {
  if (!list.length) {
    document.getElementById('cuisineChart').innerHTML = `<p style="color:var(--muted);font-size:0.85rem">No data yet.</p>`;
    return;
  }
  const max = Math.max(...list.map(c => c.restaurantCount));
  document.getElementById('cuisineChart').innerHTML = list.map(c => `
    <div class="bar-row">
      <div class="bar-row-label">
        <span><strong>${c.cuisine}</strong></span>
        <span>${c.restaurantCount} restaurant${c.restaurantCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(c.restaurantCount / max) * 100}%"></div>
      </div>
    </div>
  `).join('');
}

function renderBookingStatus(list, total) {
  const statuses = ['pending', 'confirmed', 'cancelled'];
  const map = {};
  list.forEach(s => map[s.status] = s.count);

  if (!total) {
    document.getElementById('bookingStatusChart').innerHTML = `<p style="color:var(--muted);font-size:0.85rem">No reservations yet.</p>`;
    return;
  }

  document.getElementById('bookingStatusChart').innerHTML = statuses.map(s => `
    <div class="status-chip-card ${s}">
      <div class="status-chip-num">${map[s] || 0}</div>
      <div class="status-chip-label">${s}</div>
    </div>
  `).join('');
}

function renderPopularBooked(list) {
  const el = document.getElementById('popularBookedChart');
  if (!list.length) {
    el.innerHTML = `<p style="color:var(--muted);font-size:0.85rem">No reservations yet — book a table to see this populate.</p>`;
    return;
  }
  const max = Math.max(...list.map(t => t.count));
  el.innerHTML = list.map(t => `
    <div class="bar-row">
      <div class="bar-row-label">
        <span><strong>${t.type}</strong></span>
        <span>${t.count} booking${t.count !== 1 ? 's' : ''} · ${t.totalGuests} guests</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(t.count / max) * 100}%"></div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// BOOKINGS TABLE (CRUD)
// ============================================================
async function loadBookings(search = '') {
  const tbody = document.getElementById('bookingsTableBody');
  tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--muted)">Loading…</td></tr>`;

  try {
    const params = new URLSearchParams();
    if (currentStatusFilter !== 'all') params.set('status', currentStatusFilter);
    if (search) params.set('search', search);

    const res = await fetch(`${BASE}/bookings?${params}`);
    const { data, count } = await res.json();

    document.getElementById('bookingResultCount').textContent = `${count} reservation${count !== 1 ? 's' : ''}`;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2.5rem;color:var(--muted)">No reservations found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(renderBookingRow).join('');
    bindRowActions();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--muted)">Failed to load. Is the server running?</td></tr>`;
  }
}

function renderBookingRow(b) {
  const ref = b._id.slice(-8).toUpperCase();
  const dateObj = new Date(b.date);
  const dateStr = isNaN(dateObj) ? b.date : dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return `
    <tr data-id="${b._id}">
      <td><span class="ref-code">#${ref}</span></td>
      <td>
        <div class="guest-name">${escapeHtml(b.name)}</div>
        <div class="guest-phone">${escapeHtml(b.phone)}</div>
      </td>
      <td>${escapeHtml(b.restaurant_name)}</td>
      <td>${escapeHtml(b.buffet_type)}</td>
      <td>${dateStr}<br><span style="font-size:0.74rem;color:var(--muted)">${escapeHtml(b.time_slot)}</span></td>
      <td>${b.party_size}</td>
      <td><span class="status-badge ${b.status}">${b.status}</span></td>
      <td>
        <div class="action-btns">
          ${b.status !== 'confirmed' ? `<button class="action-btn confirm" data-action="confirm">Confirm</button>` : ''}
          ${b.status !== 'cancelled' ? `<button class="action-btn cancel" data-action="cancel">Cancel</button>` : ''}
          <button class="action-btn delete" data-action="delete">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function bindRowActions() {
  document.querySelectorAll('.action-btns button').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const row = e.target.closest('tr');
      const id = row.dataset.id;
      const action = btn.dataset.action;

      try {
        if (action === 'confirm') {
          await fetch(`${BASE}/bookings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'confirmed' }),
          });
        } else if (action === 'cancel') {
          await fetch(`${BASE}/bookings/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' }),
          });
        } else if (action === 'delete') {
          if (!confirm('Delete this reservation permanently?')) return;
          await fetch(`${BASE}/bookings/${id}`, { method: 'DELETE' });
        }
        loadBookings(document.getElementById('bookingSearch').value.trim());
        loadStats(); // refresh stats since booking status changed
      } catch (err) {
        alert('Action failed. Please try again.');
      }
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
