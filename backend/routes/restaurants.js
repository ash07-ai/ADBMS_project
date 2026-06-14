const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');

// GET /api/restaurants — list with filters
router.get('/', async (req, res) => {
  try {
    const { area, type, min_price, max_price, search, featured } = req.query;
    const query = { is_active: true };

    if (area && area !== 'all') query.area = new RegExp(area, 'i');
    if (featured === 'true') query.is_featured = true;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { area: new RegExp(search, 'i') },
        { cuisine: new RegExp(search, 'i') },
        { tagline: new RegExp(search, 'i') },
      ];
    }

    // Filter by buffet type
    if (type && type !== 'all') {
      query['buffets.type'] = new RegExp(type, 'i');
    }

    let restaurants = await Restaurant.find(query).sort({ is_featured: -1, rating: -1 });

    // Filter by price range (post-query since price is nested)
    if (min_price || max_price) {
      restaurants = restaurants.filter((r) => {
        return r.buffets.some((b) => {
          const price = b.price_min || b.price_max;
          if (!price) return false;
          if (min_price && price < Number(min_price)) return false;
          if (max_price && price > Number(max_price)) return false;
          return true;
        });
      });
    }

    res.json({ success: true, count: restaurants.length, data: restaurants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/restaurants/:slug — single restaurant
router.get('/:slug', async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ slug: req.params.slug, is_active: true });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/restaurants/areas/list — unique areas
router.get('/meta/areas', async (req, res) => {
  try {
    const areas = await Restaurant.distinct('area', { is_active: true });
    res.json({ success: true, data: areas.sort() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
