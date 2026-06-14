const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const Booking = require('../models/Booking');

// GET /api/stats — aggregated platform statistics
router.get('/', async (req, res) => {
  try {
    // 1. Top rated restaurants
    const topRated = await Restaurant.aggregate([
      { $match: { is_active: true } },
      { $project: { name: 1, area: 1, rating: 1, review_count: 1 } },
      { $sort: { rating: -1, review_count: -1 } },
      { $limit: 5 },
    ]);

    // 2. Average buffet price by area
    const avgPriceByArea = await Restaurant.aggregate([
      { $match: { is_active: true } },
      { $unwind: '$buffets' },
      {
        $group: {
          _id: '$area',
          avgPrice: { $avg: '$buffets.price_min' },
          minPrice: { $min: '$buffets.price_min' },
          maxPrice: { $max: '$buffets.price_max' },
          buffetCount: { $sum: 1 },
        },
      },
      { $sort: { avgPrice: 1 } },
      {
        $project: {
          area: '$_id',
          avgPrice: { $round: ['$avgPrice', 0] },
          minPrice: 1,
          maxPrice: 1,
          buffetCount: 1,
          _id: 0,
        },
      },
    ]);

    // 3. Buffet type distribution
    const buffetTypeDistribution = await Restaurant.aggregate([
      { $match: { is_active: true } },
      { $unwind: '$buffets' },
      {
        $group: {
          _id: '$buffets.type',
          count: { $sum: 1 },
          avgPrice: { $avg: '$buffets.price_min' },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          type: '$_id',
          count: 1,
          avgPrice: { $round: ['$avgPrice', 0] },
          _id: 0,
        },
      },
    ]);

    // 4. Most popular buffet type by bookings
    const popularBookedTypes = await Booking.aggregate([
      {
        $group: {
          _id: '$buffet_type',
          count: { $sum: 1 },
          totalGuests: { $sum: '$party_size' },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          type: '$_id',
          count: 1,
          totalGuests: 1,
          _id: 0,
        },
      },
    ]);

    // 5. Booking status breakdown
    const bookingStatusBreakdown = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]);

    // 6. Cuisine popularity (how many restaurants offer each cuisine)
    const cuisinePopularity = await Restaurant.aggregate([
      { $match: { is_active: true } },
      { $unwind: '$cuisine' },
      {
        $group: {
          _id: '$cuisine',
          restaurantCount: { $sum: 1 },
        },
      },
      { $sort: { restaurantCount: -1 } },
      { $limit: 8 },
      {
        $project: {
          cuisine: '$_id',
          restaurantCount: 1,
          _id: 0,
        },
      },
    ]);

    // 7. Overview counts
    const totalRestaurants = await Restaurant.countDocuments({ is_active: true });
    const totalReviews = await Review.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalBuffetSlots = await Restaurant.aggregate([
      { $match: { is_active: true } },
      { $project: { count: { $size: '$buffets' } } },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]);

    // 8. Cheapest hi-tea buffets (under budget finder)
    const cheapestHiTea = await Restaurant.aggregate([
      { $match: { is_active: true } },
      { $unwind: '$buffets' },
      { $match: { 'buffets.type': 'Hi-Tea' } },
      { $sort: { 'buffets.price_min': 1 } },
      { $limit: 5 },
      {
        $project: {
          name: 1,
          area: 1,
          price: '$buffets.price_min',
          priceLabel: '$buffets.price_label',
          _id: 0,
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalRestaurants,
          totalReviews,
          totalBookings,
          totalBuffetSlots: totalBuffetSlots[0]?.total || 0,
        },
        topRated,
        avgPriceByArea,
        buffetTypeDistribution,
        popularBookedTypes,
        bookingStatusBreakdown,
        cuisinePopularity,
        cheapestHiTea,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
