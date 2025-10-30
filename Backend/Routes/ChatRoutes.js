const express = require("express");
const router = express.Router();
const {
  ChatPostController,
  GetChatController,
  EditChatController,
  DeleteChatController,
} = require("../Controllers/chatController");
const verifyToken = require("../middleware/authMiddleware");

// Send message
router.post("/send", verifyToken, ChatPostController);

// Get messages between users
router.get("/:senderId/:receiverId", verifyToken, GetChatController);

// Edit message
router.put("/edit/:chatId", verifyToken, EditChatController);

// ✅ Fix: use chatId in URL instead of relying on body
router.delete("/delete/:chatId/:userId", verifyToken, DeleteChatController);

module.exports = router;
