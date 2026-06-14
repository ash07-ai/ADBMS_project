// modal.js — Restaurant detail modal for Buffetly
import { api } from './api.js';
import { openBooking } from './booking.js';
import { renderStars, showToast } from './ui.js';

let currentRestaurantId = null;
let selectedRating = 0;

export function initModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

export async function openModal(slug) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  content.innerHTML = `
    <div style="padding:3rem;text-align:center">
      <div style="font-size:2rem;margin-bottom:1rem">🍽️</div>
      <p style="color:var(--muted)">Loading restaurant details…</p>
    </div>
  `;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    const { data: r } = await api.getRestaurant(slug);
    currentRestaurantId = r._id;
    const { data: reviews } = await api.getReviews(r._id);
    content.innerHTML = renderModalContent(r, reviews);
    bindModalEvents(r);
  } catch (err) {
    content.innerHTML = `
      <div style="padding:3rem;text-align:center">
        <p style="color:var(--muted)">Could not load restaurant. Please try again.</p>
      </div>
    `;
  }
}

export function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  currentRestaurantId = null;
  selectedRating = 0;
}

// --- Menu grouped by category ---
function renderMenuItems(items) {
  if (!items || !items.length) return '';

  // Group by category
  const groups = {};
  items.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item.name);
  });

  const categoryIcons = {
    'Starters': '🥗', 'Main Course': '🍛', 'Desi Main': '🫕',
    'Live Station': '🔥', 'Live Station (BBQ)': '🔥', 'BBQ': '🍖',
    'Desserts': '🍮', 'Beverages': '🥤', 'Welcome Drink': '🥤',
    'Breads': '🫓', 'Sides': '🥙', 'Salads': '🥗',
    'Main (Asian)': '🍜', 'Desi Main': '🫕',
  };

  return Object.entries(groups).map(([cat, dishes]) => `
    <div class="menu-category">
      <div class="menu-cat-header">
        <span class="menu-cat-icon">${categoryIcons[cat] || '🍽️'}</span>
        <span class="menu-cat-name">${cat}</span>
        <span class="menu-cat-count">${dishes.length} item${dishes.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="menu-items-list">
        ${dishes.map(d => `<span class="menu-item-chip">${d}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

function renderBuffetTabs(buffets) {
  const tabs = buffets.map((b, i) => `
    <button class="buffet-tab ${i === 0 ? 'active' : ''}" data-tab="${i}">
      ${b.type}
    </button>
  `).join('');

  const panels = buffets.map((b, i) => `
    <div class="buffet-panel ${i === 0 ? 'active' : ''}" data-panel="${i}">
      <div class="buffet-panel-meta">
        <div class="buffet-price-big">${b.price_label || 'Call for price'}</div>
        <div class="buffet-timing-row">
          <span>🕐 ${b.timings || '—'}</span>
          <span class="buffet-days-pill">${b.days_available || 'Daily'}</span>
        </div>
      </div>
      ${b.menu_items && b.menu_items.length ? `
        <div class="menu-section">
          <div class="menu-section-label">What's on the menu</div>
          ${renderMenuItems(b.menu_items)}
        </div>
      ` : '<p style="color:var(--muted);font-size:.85rem;margin-top:1rem">Menu details coming soon.</p>'}
    </div>
  `).join('');

  return `
    <div class="buffet-tabs">${tabs}</div>
    <div class="buffet-panels">${panels}</div>
  `;
}

function renderModalContent(r, reviews) {
  const reviewsHtml = reviews.length
    ? reviews.map(rv => `
        <div class="review-card">
          <div class="review-header">
            <span class="review-author">${escapeHtml(rv.author_name)}</span>
            <span class="stars" style="color:var(--saffron)">${renderStars(rv.rating)}</span>
          </div>
          <div class="review-comment">${escapeHtml(rv.comment || '')}</div>
          ${rv.buffet_type ? `<div class="review-type">📌 ${rv.buffet_type} buffet</div>` : ''}
        </div>
      `).join('')
    : `<p style="color:var(--muted);font-size:.85rem;">No reviews yet. Be the first!</p>`;

  return `
    <div class="modal-hero">
      <img src="${r.image_url}" alt="${r.name}">
      <div class="modal-hero-overlay"></div>
      <button class="modal-close" onclick="window._closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-meta">
        <span class="modal-area">📍 ${r.area}</span>
        <span class="modal-cuisine">${(r.cuisine || []).join(' · ')}</span>
      </div>
      <h2>${r.name}</h2>
      ${r.tagline ? `<p class="modal-tagline">${r.tagline}</p>` : ''}

      <div class="modal-section-title" style="margin-bottom:1rem">Buffets & Menus</div>
      ${renderBuffetTabs(r.buffets)}

      <div class="modal-section-title" style="margin-top:1.75rem">Contact & Location</div>
      ${r.phone ? `<div class="modal-info-row"><span class="modal-info-icon">📞</span><a href="tel:${r.phone}">${r.phone}</a></div>` : ''}
      <div class="modal-info-row"><span class="modal-info-icon">📍</span><span>${r.address}</span></div>

      <div class="modal-actions">
        <button class="btn-primary" id="bookTableBtn">🍽️ Book a Table</button>
        <a href="https://www.google.com/maps/search/${encodeURIComponent(r.name + ' ' + r.area + ' Lahore')}" target="_blank" class="btn-secondary">🗺 Find on Maps</a>
        ${r.phone ? `<a href="tel:${r.phone}" class="btn-secondary">📞 Call</a>` : ''}
      </div>

      <div style="margin-top:2rem">
        <div class="modal-section-title">Reviews (${reviews.length})</div>
        <div class="reviews-list">${reviewsHtml}</div>
        <div class="add-review-form" id="reviewForm">
          <div class="modal-section-title" style="margin-top:1.5rem">Leave a Review</div>
          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input class="form-input" id="reviewName" placeholder="e.g. Ahmad Khan" />
          </div>
          <div class="form-group">
            <label class="form-label">Rating</label>
            <div class="star-rating" id="starRating">
              ${[1,2,3,4,5].map(n => `<button class="star-btn" data-star="${n}">★</button>`).join('')}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Buffet Type</label>
            <select class="form-select-field" id="reviewType">
              <option value="">Select type…</option>
              ${[...new Set(r.buffets.map(b => b.type))].map(t => `<option value="${t}">${t}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Comment</label>
            <textarea class="form-textarea" id="reviewComment" placeholder="How was the food and experience?"></textarea>
          </div>
          <button class="btn-primary" id="submitReviewBtn" style="width:100%">Submit Review</button>
        </div>
      </div>
    </div>
  `;
}

function bindModalEvents(r) {
  // Book a Table button
  const bookBtn = document.getElementById('bookTableBtn');
  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      closeModal();
      openBooking(r);
    });
  }

  // Tab switching
  document.querySelectorAll('.buffet-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.buffet-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.buffet-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`.buffet-panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
    });
  });

  // Star rating
  const stars = document.querySelectorAll('#starRating .star-btn');
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const n = Number(star.dataset.star);
      stars.forEach((s, i) => s.classList.toggle('selected', i < n));
    });
    star.addEventListener('click', () => {
      selectedRating = Number(star.dataset.star);
    });
  });
  document.getElementById('starRating').addEventListener('mouseleave', () => {
    stars.forEach((s, i) => s.classList.toggle('selected', i < selectedRating));
  });

  // Submit review
  document.getElementById('submitReviewBtn').addEventListener('click', async () => {
    const name = document.getElementById('reviewName').value.trim();
    const comment = document.getElementById('reviewComment').value.trim();
    const buffetType = document.getElementById('reviewType').value;
    if (!name) { showToast('Please enter your name', 'error'); return; }
    if (!selectedRating) { showToast('Please select a rating', 'error'); return; }
    try {
      await api.submitReview({ restaurant_id: currentRestaurantId, author_name: name, rating: selectedRating, comment, buffet_type: buffetType });
      showToast('Review submitted! Thank you 🙏', 'success');
      document.getElementById('reviewForm').innerHTML = `<p style="color:var(--muted);font-size:.875rem;padding:1rem 0;">✅ Your review has been submitted.</p>`;
    } catch {
      showToast('Could not submit review. Try again.', 'error');
    }
  });

  window._closeModal = closeModal;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
