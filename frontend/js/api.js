// api.js — All API communication for Buffetly
const BASE = '/api';

export const api = {
  async getRestaurants(params = {}) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v && v !== 'all'))
    ).toString();
    const res = await fetch(`${BASE}/restaurants${query ? '?' + query : ''}`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    return res.json();
  },

  async getRestaurant(slug) {
    const res = await fetch(`${BASE}/restaurants/${slug}`);
    if (!res.ok) throw new Error('Restaurant not found');
    return res.json();
  },

  async getReviews(restaurantId) {
    const res = await fetch(`${BASE}/reviews/${restaurantId}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  async submitReview(data) {
    const res = await fetch(`${BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return res.json();
  },
};

// Add to existing api object — booking
export const bookingApi = {
  async createBooking(data) {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Booking failed');
    }
    return res.json();
  },
};
