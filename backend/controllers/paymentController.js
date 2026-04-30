const PaymentSettings = require("../models/PaymentSettings");

/**
 * GET /api/payments/settings
 * Returns the current payment settings (admin only).
 * If no document exists yet, returns safe defaults.
 */
const getSettings = async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne();

    // First-time: create a document with defaults so the admin has something to edit
    if (!settings) {
      settings = await PaymentSettings.create({});
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error("getSettings error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PUT /api/payments/settings
 * Upserts (creates or fully updates) the payment settings document.
 * Body accepts a partial or full PaymentSettings object.
 */
const updateSettings = async (req, res) => {
  try {
    const {
      upiId,
      qrCodeImage,
      upiEnabled,
      qrEnabled,
      cashEnabled,
      cardEnabled,
      instructions,
    } = req.body;

    // Build only the fields that were actually sent
    const update = {};
    if (upiId !== undefined)       update.upiId       = upiId;
    if (qrCodeImage !== undefined)  update.qrCodeImage  = qrCodeImage;
    if (upiEnabled !== undefined)   update.upiEnabled   = upiEnabled;
    if (qrEnabled !== undefined)    update.qrEnabled    = qrEnabled;
    if (cashEnabled !== undefined)  update.cashEnabled  = cashEnabled;
    if (cardEnabled !== undefined)  update.cardEnabled  = cardEnabled;
    if (instructions !== undefined) update.instructions = instructions;

    const settings = await PaymentSettings.findOneAndUpdate(
      {},          // match the singleton
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: "Payment settings saved", settings });
  } catch (error) {
    console.error("updateSettings error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
