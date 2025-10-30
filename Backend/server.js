// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const ChatModel = require("./Models/ChatModel");
const UserModel = require("./Models/UserModel");

dotenv.config();

const app = express();
app.use(express.json());

// Replace with your Netlify frontend URL
const FRONTEND_URL = "https://incandescent-kitten-729b4c.netlify.app";

// CORS setup
app.use(
  cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Serve uploads
app.use("/uploads", express.static("uploads"));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// API Routes
app.use("/api/user", require("./Routes/UserRoutes"));
app.use("/api/chat", require("./Routes/ChatRoutes"));

// Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Maps for tracking online users
const onlineUsers = new Map();       // userId -> socketId
const socketUserMap = new Map();     // socketId -> userId

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // User comes online
  socket.on("user-online", async (userId) => {
    if (!userId) return;

    onlineUsers.set(userId, socket.id);
    socketUserMap.set(socket.id, userId);

    try {
      await UserModel.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("userStatusUpdate", { userId, isOnline: true });
    } catch (err) {
      console.error("Error updating user status:", err);
    }
  });

  // Sending a message
  socket.on("send-message", async ({ fromUserId, toUserId, message }) => {
    if (!fromUserId || !toUserId || !message) {
      return socket.emit("message-error", { error: "Invalid message data" });
    }

    try {
      const newChat = await ChatModel.create({
        sender: fromUserId,
        receiver: toUserId,
        message,
      });

      // Send message to receiver if online
      const receiverSocket = onlineUsers.get(toUserId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("receive-message", { chat: newChat });
      }

      // Confirm message sent to sender
      socket.emit("message-sent", { chat: newChat });
    } catch (err) {
      console.error("Message send error:", err);
      socket.emit("message-error", { error: "Failed to send message" });
    }
  });

  // User disconnect
  socket.on("disconnect", async () => {
    const userId = socketUserMap.get(socket.id);
    if (!userId) return;

    onlineUsers.delete(userId);
    socketUserMap.delete(socket.id);

    try {
      await UserModel.findByIdAndUpdate(userId, { isOnline: false });
      io.emit("userStatusUpdate", { userId, isOnline: false });
    } catch (err) {
      console.error("Error updating user status on disconnect:", err);
    }

    console.log("⚡ User disconnected:", socket.id, "UserID:", userId);
  });
});

// ✅ Backend only (do NOT serve frontend here)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
