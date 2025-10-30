const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Models
const ChatModel = require("./Models/ChatModel");
const UserModel = require("./Models/UserModel");

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
console.log("🔍 Mongo URI:", MONGO_URI);

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ROUTES
app.use("/api/user", require("./Routes/UserRoutes"));
app.use("/api/account", require("./Routes/AccountRoutes"));
app.use("/api/student", require("./Routes/StudentRoutes"));
app.use("/api/alumni", require("./Routes/AlumniRoutes"));
app.use("/api/chat", require("./Routes/ChatRoutes"));
app.use("/api/admin", require("./Routes/AdminRoutes"));
app.use("/api/search", require("./Routes/SearchRoutes"));
app.use("/api/auth", require("./Routes/ForgotRoutes"));

// SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // User comes online
  socket.on("userOnline", async (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    console.log(`🟢 ${userId} is online`);

    try {
      await UserModel.findByIdAndUpdate(userId, { isOnline: true });
      io.emit("userStatusUpdate", { userId, isOnline: true });
    } catch (err) {
      console.error("Error updating online status:", err);
    }
  });

  // Sending message
  socket.on("send-message", async ({ fromUserId, toUserId, message }) => {
    try {
      const newChat = await ChatModel.create({
        sender: fromUserId,
        receiver: toUserId,
        message,
      });

      const receiverSocket = onlineUsers.get(toUserId);
      if (receiverSocket) {
        io.to(receiverSocket).emit("receive-message", { chat: newChat });
      }

      socket.emit("message-sent", { chat: newChat });
    } catch (err) {
      console.error("Message error:", err);
    }
  });

  // User disconnects
  socket.on("disconnect", async () => {
    let disconnectedUserId = null;
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        console.log(`🔴 ${userId} went offline`);
        break;
      }
    }

    if (disconnectedUserId) {
      try {
        await UserModel.findByIdAndUpdate(disconnectedUserId, { isOnline: false });
        io.emit("userStatusUpdate", { userId: disconnectedUserId, isOnline: false });
      } catch (err) {
        console.error("Error updating offline status:", err);
      }
    }
  });
});

// ✅ Serve React frontend for production
app.use(express.static(path.join(__dirname, "client", "build")));

app.get("/*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
});

// PORT
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
