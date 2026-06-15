const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    restaurant_name: { type: String, required: true },
    buffet_type: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: {
  type: String,
  required: true,
  trim: true,
  validate: {
    validator: function(v) {
      return /^\d{10,11}$/.test(v.replace(/[\s\-]/g, ''));
    },
    message: 'Phone number must be 10–11 digits.'
  }
},
date: {
  type: String,
  required: true,
  validate: {
    validator: function(v) {
      const booking = new Date(v);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + 10);
      return booking >= today && booking <= maxDate;
    },
    message: 'Booking date must be within the next 10 days.'
  }
},
    time_slot: { type: String, required: true },
    party_size: { type: Number, required: true, min: 1, max: 50 },
    special_requests: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
