// booking.js — Table reservation system for Buffetly
import { bookingApi } from './api.js';
import { showToast } from './ui.js';

let currentRestaurant = null;

export function initBooking() {
  // Create overlay HTML and inject into body
  const overlay = document.createElement('div');
  overlay.className = 'booking-overlay';
  overlay.id = 'bookingOverlay';
  overlay.innerHTML = `<div class="booking-modal" id="bookingModal"></div>`;
  document.body.appendChild(overlay);

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeBooking();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeBooking();
  });
}

export function openBooking(restaurant) {
  currentRestaurant = restaurant;
  const overlay = document.getElementById('bookingOverlay');
  const modal = document.getElementById('bookingModal');

  // Get unique buffet types for this restaurant
  const buffetTypes = [...new Set(restaurant.buffets.map(b => b.type))];

  // Get tomorrow's date as default
// Min = tomorrow, max = 10 days from today
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxBooking = new Date();
  maxBooking.setDate(maxBooking.getDate() + 10);
  const maxDate = maxBooking.toISOString().split('T')[0];

  modal.innerHTML = `
    <div class="booking-header">
      <div>
        <h3>Reserve a Table</h3>
        <div class="booking-restaurant-name">📍 ${restaurant.name}</div>
      </div>
      <button class="booking-close" id="bookingCloseBtn">✕</button>
    </div>
    <div class="booking-body">
      <div class="booking-info-box">
        <strong>Note:</strong> This is a reservation request. The restaurant will confirm your booking directly via phone call. Make sure your number is correct.
      </div>

      <div class="form-group">
        <label class="form-label">Buffet Type *</label>
        <select class="form-select-field" id="bk-type">
          <option value="">Select buffet…</option>
          ${buffetTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Your Name *</label>
          <input class="form-input" id="bk-name" placeholder="e.g. Ahmad Khan" />
        </div>
        <div class="form-group">
          <label class="form-label">Phone Number *</label>
          <input class="form-input" id="bk-phone" placeholder="03XX-XXXXXXX" type="tel" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Date *</label>
         <input class="form-input" id="bk-date" type="date" min="${minDate}" max="${maxDate}" />
        </div>
        <div class="form-group">
          <label class="form-label">Time Slot *</label>
          <select class="form-select-field" id="bk-time">
            <option value="">Select time…</option>
            <option value="12:00 PM – 1:00 PM">12:00 PM – 1:00 PM</option>
            <option value="1:00 PM – 2:00 PM">1:00 PM – 2:00 PM</option>
            <option value="3:30 PM – 5:00 PM">3:30 PM – 5:00 PM</option>
            <option value="5:00 PM – 6:30 PM">5:00 PM – 6:30 PM</option>
            <option value="7:00 PM – 9:00 PM">7:00 PM – 9:00 PM</option>
            <option value="9:00 PM – 11:00 PM">9:00 PM – 11:00 PM</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Party Size *</label>
        <select class="form-select-field" id="bk-size">
          <option value="">Number of guests…</option>
          ${[1,2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}">${n} ${n === 1 ? 'person' : 'people'}</option>`).join('')}
          <option value="11">11–15 people</option>
          <option value="16">16–20 people</option>
          <option value="25">25+ people (group)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Special Requests <span style="color:var(--muted);font-weight:400">(optional)</span></label>
        <textarea class="form-textarea" id="bk-requests" placeholder="e.g. Birthday celebration, wheelchair access, high chair needed…" style="min-height:70px"></textarea>
      </div>

      <button class="btn-primary" id="bk-submit" style="width:100%;margin-top:0.5rem">
        Confirm Reservation Request
      </button>
    </div>
  `;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Bind events
  document.getElementById('bookingCloseBtn').addEventListener('click', closeBooking);
  document.getElementById('bk-submit').addEventListener('click', handleSubmit);
}

async function handleSubmit() {
  const type    = document.getElementById('bk-type').value;
  const name    = document.getElementById('bk-name').value.trim();
  const phone   = document.getElementById('bk-phone').value.trim();
  const date    = document.getElementById('bk-date').value;
  const time    = document.getElementById('bk-time').value;
  const size    = document.getElementById('bk-size').value;
  const notes   = document.getElementById('bk-requests').value.trim();

  // Validation
  if (!type)  { showToast('Please select a buffet type', 'error'); return; }
if (!phone) { showToast('Please enter your phone number', 'error'); return; }
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  if (!/^\d{10,11}$/.test(cleanPhone)) {
    showToast('Phone number must be 10–11 digits (no spaces/dashes)', 'error');
    return;
  }
  if (!date)  { showToast('Please select a date', 'error'); return; }
  const selectedDate = new Date(date);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 10);
  if (selectedDate < today || selectedDate > maxDate) {
    showToast('Date must be within the next 10 days', 'error');
    return;
  }
  if (!date)  { showToast('Please select a date', 'error'); return; }
  if (!time)  { showToast('Please select a time slot', 'error'); return; }
  if (!size)  { showToast('Please select party size', 'error'); return; }

  const btn = document.getElementById('bk-submit');
  btn.textContent = 'Submitting…';
  btn.disabled = true;

  try {
    const result = await bookingApi.createBooking({
      restaurant_id: currentRestaurant._id,
      buffet_type: type,
      name, phone, date,
      time_slot: time,
      party_size: Number(size),
      special_requests: notes,
    });

    // Show success
    const refId = result.data._id.toString().slice(-8).toUpperCase();
    document.getElementById('bookingModal').innerHTML = `
      <div class="booking-success">
        <div class="booking-success-icon">🎉</div>
        <h3>Reservation Requested!</h3>
        <p>Your table request at <strong>${currentRestaurant.name}</strong> has been recorded.</p>
        <div class="booking-ref">REF #${refId}</div>
        <p>The restaurant will call you on <strong>${phone}</strong> to confirm your booking.</p>
        <button class="btn-primary" style="margin-top:1.5rem;width:100%" id="bk-done">Done</button>
      </div>
    `;
    document.getElementById('bk-done').addEventListener('click', closeBooking);
    showToast('Reservation saved! ✅', 'success');

  } catch (err) {
    showToast(err.message || 'Could not save booking. Try again.', 'error');
    btn.textContent = 'Confirm Reservation Request';
    btn.disabled = false;
  }
}

export function closeBooking() {
  const overlay = document.getElementById('bookingOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}
