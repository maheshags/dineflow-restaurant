
const express = require("express");

require("dotenv").config();

const connectDB = require("./config/db");
connectDB();

const app = express();

// Middleware
const cors = require("cors");
app.use(cors());

// Increase body size limit to 10MB to support base64-encoded QR images
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Test route
app.get("/", (req, res) => {
  res.send("Server working ✅");
});

// ── Auth routes (new — /api/auth) ─────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// ── Legacy user routes (kept for backward compatibility) ──────────────────────
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// ── User profile routes ───────────────────────────────────────────────────────
app.use("/api/user", userRoutes);

// ── Cart routes ───────────────────────────────────────────────────────────────
const cartRoutes = require("./routes/cartRoutes");
app.use("/api/cart", cartRoutes);

const foodRoutes = require("./routes/foodRoutes");
app.use("/api/foods", foodRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

const ratingRoutes = require("./routes/ratingRoutes");
app.use("/api/ratings", ratingRoutes);

const categoryRoutes = require("./routes/categoryRoutes");
app.use("/api/categories", categoryRoutes);

const inventoryRoutes = require("./routes/inventoryRoutes");
app.use("/api/inventory", inventoryRoutes);

const analyticsRoutes = require("./routes/analyticsRoutes");
app.use("/api/analytics", analyticsRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

// ── Admin Delivery Team routes ────────────────────────────────────────────────
const adminDeliveryTeamRoutes = require("./routes/adminDeliveryTeamRoutes");
app.use("/api/admin/delivery-team", adminDeliveryTeamRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);

const profileRoutes = require("./routes/profileRoutes");
app.use("/api/profile", profileRoutes);

// ── Delivery Partner routes ───────────────────────────────────────────────────
const deliveryOrderRoutes = require("./routes/deliveryOrderRoutes");
app.use("/api/delivery/orders", deliveryOrderRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});