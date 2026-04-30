const RestaurantProfile = require("../models/RestaurantProfile");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * GET /api/profile
 * Returns the current restaurant profile.
 * Auto-creates a document with defaults on first call.
 */
const getProfile = async (req, res) => {
  try {
    let profile = await RestaurantProfile.findOne();

    if (!profile) {
      // Seed with the logged-in admin's name/email as sensible first-time defaults
      profile = await RestaurantProfile.create({
        ownerName: req.user?.name || "",
        email:     req.user?.email || "",
      });
    }

    res.json({ success: true, profile });
  } catch (error) {
    console.error("getProfile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/profile
 * Upserts the restaurant profile.
 * Accepts a partial body — only fields present in the request are updated.
 */
const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name", "ownerName", "email", "phone",
      "address", "logo", "openingTime", "closingTime", "description",
    ];

    const update = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    });

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const profile = await RestaurantProfile.findOneAndUpdate(
      {},             // match the singleton
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: "Profile saved", profile });
  } catch (error) {
    console.error("updateProfile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/profile/change-password
 * Changes the admin's password.
 * Body: { currentPassword, newPassword }
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("changePassword error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword };
