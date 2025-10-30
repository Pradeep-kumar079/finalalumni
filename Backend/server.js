const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const ChatModel = require("./Models/ChatModel");
const UserModel = require("./Models/UserModel");

dotenv.config();

const app = express();
app.use(express.json());

const FRONTEND_URL = "https://incandescent-kitten-729b4c.netlify.app";

app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use("/uploads", express.static("uploads"));

// MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// API Routes
app.use("/api/user", require("./Routes/UserRoutes"));
// ... other routes

// Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

const onlineUsers = new Map();

io.on("connection", socket => {
  console.log("⚡ User connected:", socket.id);

  socket.on("user-online", async (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    await UserModel.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("userStatusUpdate", { userId, isOnline: true });
  });

  socket.on("send-message", async ({ fromUserId, toUserId, message }) => {
    const newChat = await ChatModel.create({ sender: fromUserId, receiver: toUserId, message });
    const receiverSocket = onlineUsers.get(toUserId);
    if (receiverSocket) io.to(receiverSocket).emit("receive-message", { chat: newChat });
    socket.emit("message-sent", { chat: newChat });
  });

  socket.on("disconnect", async () => {
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        await UserModel.findByIdAndUpdate(userId, { isOnline: false });
        io.emit("userStatusUpdate", { userId, isOnline: false });
        break;
      }
    }
  });
});

// Serve React
const buildPath = path.join(__dirname, "client", "build");
app.use(express.static(buildPath));
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) res.sendFile(path.join(buildPath, "index.html"));
});

server.listen(process.env.PORT || 5000, () => console.log("🚀 Server running"));
