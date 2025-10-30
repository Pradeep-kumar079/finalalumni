const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  admissionyear: { type: Number, required: true },
  branches: [{ type: String, required: true }],
  role: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserModel",
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("BatchModel" , batchSchema);
