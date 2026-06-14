const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
});

const buffetSlotSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Hi-Tea', 'Lunch', 'Dinner', 'Brunch', 'All-Day'],
    required: true,
  },
  price_min: { type: Number },
  price_max: { type: Number },
  price_label: { type: String },
  timings: { type: String },
  days_available: { type: String, default: 'Daily' },
  menu_items: [menuItemSchema],
});

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    tagline: { type: String },
    address: { type: String, required: true },
    area: { type: String, required: true },
    phone: { type: String },
    cuisine: [{ type: String }],
    image_url: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    review_count: { type: Number, default: 0 },
    buffets: [buffetSlotSchema],
    is_featured: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    google_maps_url: { type: String },
    instagram_url: { type: String },
  },
  { timestamps: true }
);

restaurantSchema.virtual('min_price').get(function () {
  if (!this.buffets.length) return null;
  const prices = this.buffets.filter((b) => b.price_min).map((b) => b.price_min);
  return prices.length ? Math.min(...prices) : null;
});

restaurantSchema.set('toJSON', { virtuals: true });
restaurantSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
