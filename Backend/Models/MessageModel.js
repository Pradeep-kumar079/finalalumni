const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    targetType: {
      type: String,
      enum: ["all", "batch", "custom"],
      default: "all",
    },
    batchYear: { type: String },
    recipients: [{ type: String }], // stores email list
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
