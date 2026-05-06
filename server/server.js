import express from "express";
import connectDB from "./config/mongodb.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import path from "path";
// Routes
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import roomRouter from "./routes/roomRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";

// Socket helpers
import { activeRooms } from "./socket/stateManager.js";
import roomModel from "./models/roomModel.js";

const app = express();
const port = process.env.PORT || 4000;

connectDB();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL || "https://syncchat.vercel.app",
];

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Socket connection
io.on("connection", (socket) => {
  // --- JOIN ROOM ---
  socket.on("joinRoom", async (roomId, userName, userId) => {
    const room = await roomModel.findOne({ roomId });
    if (!room) {
      socket.emit("errorMessage", "Room does not exist");
      return;
    }

    if (!activeRooms[roomId]) {
      activeRooms[roomId] = { participants: {}, timer: null };
    }

    const roomData = activeRooms[roomId];
    const currentCount = Object.keys(roomData.participants).length;

    if (currentCount >= room.maxParticipants) {
      socket.emit("roomFull", { message: "Room is full" });
      return;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;

    const role =
      room.hostId && room.hostId.toString() === userId?.toString()
        ? "Host"
        : "Participant";

    roomData.participants[socket.id] = {
      id: userId,
      socketId: socket.id,
      name: userName,
      role,
    };

    if (role === "Host") roomData.hostId = socket.id;

    // Start room timer if not active
    if (!roomData.timer) {
      roomData.timer = setInterval(() => {
        const remaining = room.expiryTime - Date.now();
        if (remaining <= 0) {
          clearInterval(roomData.timer);
          io.to(roomId).emit("sessionEnded");
          delete activeRooms[roomId];
        } else {
          io.to(roomId).emit("sessionTimer", formatRemainingTime(remaining));
        }
      }, 1000);
    }

    const roomParticipants = Object.values(roomData.participants);
    io.to(roomId).emit("updateParticipants", roomParticipants);

    socket.emit("roomInfo", {
      name: room.roomName,
      meetingId: room.roomId,
      sessionTime: formatRemainingTime(room.expiryTime - Date.now()),
      hostId: room.hostId.toString(),
      host: { id: room.hostId.toString(), name: room.hostName },
      allowUploads: room.allowImages,
    });

    socket.to(roomId).emit("userJoined", `${userName} joined the chat`);
  });

  // --- LEAVE ROOM ---
  socket.on("leaveRoom", (roomId, userName) => {
    const roomData = activeRooms[roomId];
    if (!roomData?.participants[socket.id]) return;

    delete roomData.participants[socket.id];
    const roomParticipants = Object.values(roomData.participants);

    io.to(roomId).emit("updateParticipants", roomParticipants);
    socket.to(roomId).emit("userLeft", `${userName} left the chat`);

    if (roomParticipants.length === 0) {
      if (roomData.timer) clearInterval(roomData.timer);
      delete activeRooms[roomId];
    }

    socket.leave(roomId);
  });

  // --- SEND MESSAGE ---
  socket.on("sendMessage", (data) => {
    const { roomId, userName, message, imageUrl, timestamp } = data;
    if (!activeRooms[roomId]) {
      socket.emit("errorMessage", "Room not found");
      return;
    }

    io.to(roomId).emit("receiveMessage", {
      userName,
      message: message || "",
      imageUrl: imageUrl || null,
      timestamp: timestamp || new Date(),
    });
  });

  // --- CLOSE SESSION (HOST) ---
  socket.on("closeSession", (roomId) => {
    const roomData = activeRooms[roomId];
    if (!roomData) return;
    if (socket.id !== roomData.hostId) {
      socket.emit("errorMessage", "Only the host can close the session.");
      return;
    }

    io.to(roomId).emit("sessionEnded");
    if (roomData.timer) clearInterval(roomData.timer);
    delete activeRooms[roomId];
  });

  // --- DISCONNECT ---
  socket.on("disconnect", () => {
    const roomId = socket.roomId;
    if (!roomId || !activeRooms[roomId]) return;

    const userInfo = activeRooms[roomId].participants[socket.id];
    delete activeRooms[roomId].participants[socket.id];

    const roomParticipants = Object.values(activeRooms[roomId].participants);
    io.to(roomId).emit("updateParticipants", roomParticipants);

    if (userInfo?.name) {
      socket.to(roomId).emit("userLeft", `${userInfo.name} left the chat`);
    }

    if (roomParticipants.length === 0) {
      if (activeRooms[roomId].timer) clearInterval(activeRooms[roomId].timer);
      delete activeRooms[roomId];
    }
  });
});

// Helper: Format session time

function formatRemainingTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// API Endpoints
app.get("/", (req, res) => res.send("API working"));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/room", roomRouter);
app.use("/api/upload", uploadRouter);

const __dirname = path.resolve();
// Serve React static files
app.use(express.static(path.join(__dirname, "../client/build")));

// Catch-all: send index.html for all frontend routes
app.get(/^\/(?!api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

export default app; //vercel config

// -----------------------
server.listen(port, () => console.log(`Server running on port ${port}`));
