const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');

// GET /api/reviews/:restaurant_id
router.get('/:restaurant_id', async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant_id: req.params.restaurant_id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reviews
router.post('/', async (req, res) => {
  try {
    const { restaurant_id, author_name, rating, comment, buffet_type } = req.body;
    if (!restaurant_id || !author_name || !rating) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const review = await Review.create({ restaurant_id, author_name, rating, comment, buffet_type });

    // Recalculate restaurant average rating
    const allReviews = await Review.find({ restaurant_id });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await Restaurant.findByIdAndUpdate(restaurant_id, {
      rating: Math.round(avg * 10) / 10,
      review_count: allReviews.length,
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
