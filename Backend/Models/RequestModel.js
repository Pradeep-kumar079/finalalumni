const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
  },
  status: {
    type: String,
    enum: ["pending", "connected", "rejected"],
    default: "pending",
  },
});

module.exports = mongoose.model("Request", RequestSchema);
