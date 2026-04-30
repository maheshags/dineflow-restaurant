const mongoose = require("mongoose");

/**
 * RestaurantProfile — singleton document.
 * Stores all restaurant-level configuration shown in the Settings page.
 * Only one document exists; use findOne() / findOneAndUpdate({ }, ..., { upsert: true }).
 */
const restaurantProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Spice Garden Restaurant",
      trim: true,
    },
    ownerName: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    logo: {
      type: String,   // base64 data URL or remote URL
      default: "",
    },
    openingTime: {
      type: String,
      default: "10:00",
    },
    closingTime: {
      type: String,
      default: "23:00",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestaurantProfile", restaurantProfileSchema);
