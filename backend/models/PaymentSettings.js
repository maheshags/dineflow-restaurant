const mongoose = require("mongoose");

/**
 * PaymentSettings — singleton document.
 * Only one document per restaurant is stored.
 * Use PaymentSettings.findOne() or findOneAndUpdate({}, ..., { upsert: true }).
 */
const paymentSettingsSchema = new mongoose.Schema(
  {
    upiId: {
      type: String,
      default: "",
      trim: true,
    },
    qrCodeImage: {
      type: String,
      default: "",
    },
    upiEnabled: {
      type: Boolean,
      default: true,
    },
    qrEnabled: {
      type: Boolean,
      default: false,
    },
    cashEnabled: {
      type: Boolean,
      default: true,
    },
    cardEnabled: {
      type: Boolean,
      default: true,
    },
    instructions: {
      type: String,
      default:
        "Scan the QR code or use UPI ID to complete payment before placing your order.",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentSettings", paymentSettingsSchema);
