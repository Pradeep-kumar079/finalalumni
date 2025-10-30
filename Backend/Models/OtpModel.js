const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }
});

module.exports = mongoose.model("OtpModel", OtpSchema);
