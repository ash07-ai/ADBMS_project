# 🍽️ Buffetly — Lahore's Buffet Discovery Platform

> A web-based platform to discover, filter, and compare buffet options across Lahore.
> Built as an ADBMS project at ITU Lahore (BSAI24014).

---

## Project Structure

```
buffetly/
├── backend/
│   ├── config/
│   │   ├── db.js          # MongoDB connection
│   │   └── seed.js        # Database seeder (11 real Lahore restaurants)
│   ├── models/
│   │   ├── Restaurant.js  # Restaurant + BuffetSlot schema
│   │   └── Review.js      # Review schema
│   ├── routes/
│   │   ├── restaurants.js # GET /api/restaurants, GET /api/restaurants/:slug
│   │   └── reviews.js     # GET/POST /api/reviews
│   ├── server.js          # Express app entry point
│   ├── package.json
│   └── .env               # Environment variables
│
└── frontend/
    ├── css/
    │   └── style.css      # Full design system (saffron + burgundy theme)
    ├── js/
    │   ├── main.js        # App orchestration, filter logic, event delegation
    │   ├── api.js         # All fetch calls to backend
    │   ├── cards.js       # Restaurant card rendering
    │   ├── modal.js       # Detail modal + review form
    │   └── ui.js          # Shared helpers (toast, stars, skeleton)
    └── index.html         # Main page (hero, filters, grid, modal)
```

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Backend   | Node.js + Express.js              |
| Database  | MongoDB + Mongoose ODM            |
| Frontend  | Vanilla JS (ES Modules), HTML5    |
| Fonts     | Playfair Display + Inter (Google) |
| Images    | Unsplash (placeholder)            |

---

## Setup & Run

### Prerequisites
- Node.js v16+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Install dependencies

```bash
cd buffetly/backend
npm install
```

### 2. Configure environment

Edit `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/buffetly
```

For MongoDB Atlas:
```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/buffetly
```

### 3. Seed the database

```bash
npm run seed
```

This inserts 11 real Lahore buffet restaurants with pricing and timing data.

### 4. Start the server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

### 5. Open the app

Navigate to: **http://localhost:5000**

---

## API Endpoints

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| GET    | `/api/restaurants`              | List all restaurants (filterable) |
| GET    | `/api/restaurants?type=Hi-Tea`  | Filter by buffet type          |
| GET    | `/api/restaurants?area=Gulberg` | Filter by area                 |
| GET    | `/api/restaurants?search=villa` | Search by name/area/cuisine    |
| GET    | `/api/restaurants?featured=true`| Get featured restaurants       |
| GET    | `/api/restaurants/:slug`        | Single restaurant detail       |
| GET    | `/api/reviews/:restaurant_id`   | Get reviews for a restaurant   |
| POST   | `/api/reviews`                  | Submit a review                |
| POST   | `/api/bookings`                 | Create a reservation           |
| GET    | `/api/bookings`                 | List bookings (filter by status/search) |
| PATCH  | `/api/bookings/:id`             | Update booking status          |
| DELETE | `/api/bookings/:id`             | Delete a booking                |
| GET    | `/api/stats`                    | Aggregated platform statistics |

---

## Features

- **Smart filtering** — by buffet type, area, price range
- **Live search** — debounced, searches name/area/cuisine
- **Restaurant cards** — with slot chips, pricing, ratings
- **Detail modal** — tabbed buffets with full categorized menus, contact, directions, reviews
- **Review system** — star rating, comment, per-slot feedback
- **Table booking** — full reservation form, saved to `bookings` collection
- **Admin dashboard** (`/admin.html`) — live MongoDB aggregation stats + booking management (confirm/cancel/delete)
- **Featured strip** — editor's picks carousel
- **Skeleton loading** — smooth UX while data loads
- **Responsive** — mobile-first design
- **Toast notifications** — feedback for user actions

---

## Admin Dashboard

Visit **`/admin.html`** for:

- **Overview cards** — total restaurants, buffet slots, reviews, reservations
- **Top Rated Restaurants** — `$sort` + `$limit`
- **Avg. Buffet Price by Area** — `$unwind` + `$group` + `$avg`
- **Buffet Type Distribution** — donut chart via `$unwind` + `$group`
- **Cheapest Hi-Tea Buffets** — `$match` + `$sort`
- **Cuisine Popularity** — `$unwind` + `$group` + `$sort`
- **Booking Status Breakdown** — `$group` on bookings
- **Most Booked Buffet Type** — `$group` + `$sum`
- **Reservations Table** — filter by status/search, confirm/cancel/delete (PATCH/DELETE operations on `bookings`)

All charts are custom SVG/CSS — no external chart library needed.

---

## Database Schema

### Restaurant Document
```json
{
  "name": "Ziafat Restaurant",
  "slug": "ziafat-restaurant",
  "area": "Gulberg",
  "cuisine": ["Pakistani", "Mughlai"],
  "buffets": [
    {
      "type": "Hi-Tea",
      "price_min": 2640,
      "price_label": "PKR 2,640 + tax",
      "timings": "1:00–3:00 PM | 3:00–5:00 PM | 5:00–7:00 PM",
      "days_available": "Daily"
    }
  ],
  "rating": 4.5,
  "review_count": 214
}
```

### Review Document
```json
{
  "restaurant_id": "ObjectId",
  "author_name": "Ahmad",
  "rating": 5,
  "comment": "Best mutton buffet in Lahore!",
  "buffet_type": "Hi-Tea"
}
```

---

## Why MongoDB over MySQL?

Buffet data is semi-structured — different restaurants have 1–6 slots, varying price formats, and optional fields. MongoDB's document model handles this naturally without NULLs everywhere. The `buffets` array embedded in each restaurant document avoids a JOIN every time we render a card.

That said, the `Reviews` collection still uses a reference (`restaurant_id`) to maintain a clean separation between the review data and restaurant data — a deliberate hybrid of embedding and referencing, which is idiomatic Mongoose.

---

*Buffetly · ITU Lahore · BSAI24014 · ADBMS Project 2025*
