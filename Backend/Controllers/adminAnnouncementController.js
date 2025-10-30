// Controllers/adminAnnouncementController.js
const AnnouncementModel = require("../Models/AnnouncementModel");

const createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: "All fields required" });

    const ann = await AnnouncementModel.create({ title, content, createdAt: new Date(), createdBy: req.user.id });
    res.json({ success: true, announcement: ann });
  } catch (err) {
    console.error("createAnnouncement error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAnnouncements = async (req, res) => {
  try {
    const anns = await AnnouncementModel.find().sort({ createdAt: -1 });
    res.json({ success: true, announcements: anns });
  } catch (err) {
    console.error("getAnnouncements error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const updated = await AnnouncementModel.findByIdAndUpdate(id, { title, content }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Announcement not found" });
    res.json({ success: true, announcement: updated });
  } catch (err) {
    console.error("updateAnnouncement error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AnnouncementModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Announcement not found" });
    res.json({ success: true, message: "Announcement deleted" });
  } catch (err) {
    console.error("deleteAnnouncement error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};
