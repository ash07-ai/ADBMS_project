// cards.js — Restaurant card rendering for Buffetly
import { renderStars, getSlotClass, getMinPrice, formatPrice } from './ui.js';

export function renderCard(restaurant) {
  const minPrice = getMinPrice(restaurant.buffets);
  const uniqueTypes = [...new Set(restaurant.buffets.map(b => b.type))];
  const slots = uniqueTypes.map(t =>
    `<span class="slot-chip ${getSlotClass(t)}">${t}</span>`
  ).join('');

  return `
    <article class="card" data-slug="${restaurant.slug}" role="button" tabindex="0"
             aria-label="View details for ${restaurant.name}">
      <div class="card-img">
        <img src="${restaurant.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600'}"
             alt="${restaurant.name}" loading="lazy">
        ${restaurant.is_featured ? '<span class="card-badge">Featured</span>' : ''}
        ${minPrice ? `<span class="card-price-tag">From PKR ${minPrice.toLocaleString()}</span>` : ''}
      </div>
      <div class="card-body">
        <div class="card-area">${restaurant.area}</div>
        <div class="card-name">${restaurant.name}</div>
        ${restaurant.tagline ? `<div class="card-tagline">${restaurant.tagline}</div>` : ''}
        <div class="card-slots">${slots}</div>
        <div class="card-footer">
          <div class="card-rating">
            <span class="stars">${renderStars(restaurant.rating)}</span>
            <span class="card-rating-num">${restaurant.rating.toFixed(1)}</span>
            <span class="card-rating-count">(${restaurant.review_count})</span>
          </div>
          <button class="card-btn">View Details</button>
        </div>
      </div>
    </article>
  `;
}

export function renderFeaturedCard(restaurant) {
  const minPrice = getMinPrice(restaurant.buffets);
  return `
    <div class="featured-card" data-slug="${restaurant.slug}">
      <div class="featured-card-img">
        <img src="${restaurant.image_url}" alt="${restaurant.name}" loading="lazy">
      </div>
      <div class="featured-card-body">
        <div class="featured-card-name">${restaurant.name}</div>
        <div class="featured-card-area">📍 ${restaurant.area}</div>
        ${minPrice ? `<div class="featured-card-price">From PKR ${minPrice.toLocaleString()}</div>` : ''}
      </div>
    </div>
  `;
}
