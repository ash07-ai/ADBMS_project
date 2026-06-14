const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    restaurant_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    author_name: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    buffet_type: { type: String }, // which buffet they reviewed
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
