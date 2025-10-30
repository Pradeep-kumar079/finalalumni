// Models/AnnouncementModel.js
const mongoose = require("mongoose");
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserModel" },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("AnnouncementModel", announcementSchema);
