// main.js — Buffetly App Entry Point
import { api } from './api.js';
import { renderCard, renderFeaturedCard } from './cards.js';
import { renderSkeletonCards, showToast } from './ui.js';
import { initModal, openModal } from './modal.js';
import { initBooking } from './booking.js';

// --- State ---
let filters = { type: 'all', area: 'all', min_price: '', max_price: '', search: '' };
let debounceTimer = null;

// --- DOM refs ---
const grid = document.getElementById('restaurantGrid');
const resultCount = document.getElementById('resultCount');
const featuredScroll = document.getElementById('featuredScroll');
const searchInput = document.getElementById('heroSearch');
const filterPills = document.querySelectorAll('.filter-pill[data-type]');
const areaSelect = document.getElementById('areaFilter');
const priceMin = document.getElementById('priceMin');
const priceMax = document.getElementById('priceMax');

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initModal();
  initBooking();
  initNav();
  loadRestaurants();
  loadFeatured();

  // Filter pill clicks
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      filters.type = pill.dataset.type;
      loadRestaurants();
    });
  });

  // Area filter
  areaSelect.addEventListener('change', () => {
    filters.area = areaSelect.value;
    loadRestaurants();
  });

  // Price filters
  [priceMin, priceMax].forEach(el => {
    el.addEventListener('change', () => {
      filters.min_price = priceMin.value;
      filters.max_price = priceMax.value;
      loadRestaurants();
    });
  });

  // Hero search
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        filters.search = searchInput.value.trim();
        loadRestaurants();
        if (filters.search) {
          document.getElementById('listingsSection').scrollIntoView({ behavior: 'smooth' });
        }
      }, 400);
    });

    document.getElementById('heroSearchBtn').addEventListener('click', () => {
      filters.search = searchInput.value.trim();
      loadRestaurants();
      document.getElementById('listingsSection').scrollIntoView({ behavior: 'smooth' });
    });

    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('heroSearchBtn').click();
    });
  }

  // Delegate card clicks (both grid and featured)
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-slug]');
    if (card) openModal(card.dataset.slug);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const card = e.target.closest('.card[data-slug]');
      if (card) openModal(card.dataset.slug);
    }
  });
});

async function loadRestaurants() {
  grid.innerHTML = renderSkeletonCards(6);

  try {
    const { data, count } = await api.getRestaurants(filters);
    resultCount.textContent = `${count} restaurant${count !== 1 ? 's' : ''} found`;

    if (!data.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍽️</div>
          <h3>No buffets found</h3>
          <p>Try adjusting your filters or search term.</p>
        </div>
      `;
      return;
    }
    grid.innerHTML = data.map(renderCard).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>Could not load restaurants. Is the server running?</p></div>`;
    showToast('Failed to load restaurants', 'error');
  }
}

async function loadFeatured() {
  try {
    const { data } = await api.getRestaurants({ featured: 'true' });
    featuredScroll.innerHTML = data.map(renderFeaturedCard).join('');
  } catch {
    document.getElementById('featuredSection').style.display = 'none';
  }
}

function initNav() {
  // Scroll shadow
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Mobile hamburger
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.style.position = 'absolute';
      navLinks.style.top = '68px';
      navLinks.style.left = '0'; navLinks.style.right = '0';
      navLinks.style.background = 'var(--cream)';
      navLinks.style.padding = '1.5rem 5vw';
      navLinks.style.borderBottom = '1px solid var(--border)';
    });
  }

  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}
