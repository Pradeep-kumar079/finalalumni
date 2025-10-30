const ChatModel = require("../Models/ChatModel");

// Send a chat message
const ChatPostController = async (req, res) => {
  try {
    const { fromUserId, toUserId, message } = req.body;

    if (!fromUserId || !toUserId || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const newChat = await ChatModel.create({
      sender: fromUserId,
      receiver: toUserId,
      message,
    });

    res.status(201).json({ success: true, chat: newChat });
  } catch (error) {
    console.error("ChatPostController error:", error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

// Get all chats between two users
const GetChatController = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    const chats = await ChatModel.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json({ success: true, chats });
  } catch (error) {
    console.error("GetChatController error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch chats" });
  }
};

// Edit a chat message
const EditChatController = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, userId } = req.body;

    const chat = await ChatModel.findById(chatId);
    if (!chat)
      return res.status(404).json({ success: false, message: "Chat not found" });

    if (chat.sender.toString() !== userId)
      return res
        .status(403)
        .json({ success: false, message: "Not allowed" });

    chat.message = message;
    await chat.save();

    res.status(200).json({ success: true, chat });
  } catch (error) {
    console.error("EditChatController error:", error);
    res.status(500).json({ success: false, message: "Failed to edit message" });
  }
};

// ✅ Fixed Delete chat controller
const DeleteChatController = async (req, res) => {
  try {
    const { chatId, userId } = req.params;

    const chat = await ChatModel.findById(chatId);
    if (!chat)
      return res.status(404).json({ success: false, message: "Chat not found" });

    if (chat.sender.toString() !== userId)
      return res
        .status(403)
        .json({ success: false, message: "Not allowed" });

    await chat.deleteOne();
    res.status(200).json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    console.error("DeleteChatController error:", error);
    res.status(500).json({ success: false, message: "Failed to delete message" });
  }
};

module.exports = {
  ChatPostController,
  GetChatController,
  EditChatController,
  DeleteChatController,
};
