// ui.js — UI helpers for Buffetly

export function showToast(message, type = 'default') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

export function renderStars(rating, interactive = false) {
  if (interactive) {
    return Array.from({ length: 5 }, (_, i) =>
      `<button class="star-btn" data-star="${i + 1}" aria-label="${i + 1} stars">★</button>`
    ).join('');
  }
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) html += '★';
    else if (i === full && half) html += '½';
    else html += '☆';
  }
  return html;
}

export function getSlotClass(type) {
  const map = {
    'Hi-Tea': 'hi-tea',
    'Lunch': 'lunch',
    'Dinner': 'dinner',
    'Brunch': 'brunch',
    'All-Day': 'all-day',
  };
  return map[type] || 'hi-tea';
}

export function getMinPrice(buffets) {
  const prices = buffets.filter(b => b.price_min).map(b => b.price_min);
  return prices.length ? Math.min(...prices) : null;
}

export function formatPrice(min, max) {
  if (!min) return 'Call for price';
  if (!max || min === max) return `From PKR ${min.toLocaleString()}`;
  return `PKR ${min.toLocaleString()} – ${max.toLocaleString()}`;
}

export function renderSkeletonCards(count = 6) {
  return Array.from({ length: count }, () => `
    <div class="skeleton-card">
      <div class="skeleton sk-img"></div>
      <div class="sk-body">
        <div class="skeleton sk-line w-40" style="margin-bottom:8px"></div>
        <div class="skeleton sk-line w-80" style="height:16px;margin-bottom:10px"></div>
        <div class="skeleton sk-line w-60" style="margin-bottom:18px"></div>
        <div class="skeleton sk-line w-100"></div>
      </div>
    </div>
  `).join('');
}
