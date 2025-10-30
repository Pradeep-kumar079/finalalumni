const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel", required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatModel", chatSchema);
