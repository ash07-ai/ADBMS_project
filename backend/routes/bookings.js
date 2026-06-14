const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Restaurant = require('../models/Restaurant');

// POST /api/bookings — create a booking
router.post('/', async (req, res) => {
  try {
    const { restaurant_id, buffet_type, name, phone, date, time_slot, party_size, special_requests } = req.body;

    if (!restaurant_id || !buffet_type || !name || !phone || !date || !time_slot || !party_size) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    }

    const restaurant = await Restaurant.findById(restaurant_id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found.' });

    const booking = await Booking.create({
      restaurant_id,
      restaurant_name: restaurant.name,
      buffet_type,
      name,
      phone,
      date,
      time_slot,
      party_size,
      special_requests: special_requests || '',
      status: 'pending',
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings — all bookings, with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, restaurant_id, search } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (restaurant_id) query.restaurant_id = restaurant_id;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { restaurant_name: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/bookings/:id — update booking status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/bookings/:id — remove a booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    res.json({ success: true, message: 'Booking deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
