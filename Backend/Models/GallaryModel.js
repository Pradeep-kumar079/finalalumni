const mongoose = require("mongoose");

const GallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GalleryModel", GallerySchema);
