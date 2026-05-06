import express from "express";
import connectDB from "./config/mongodb.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import crypto from "crypto";
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

    if (!activeRooms[roomId]) activeRooms[roomId] = createRoomState();

    const roomData = activeRooms[roomId];
    const currentCount = Object.keys(roomData.participants).length;

    if (room.maxParticipants > 0 && currentCount >= room.maxParticipants) {
      socket.emit("roomFull", { message: "Room is full" });
      return;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.userId = userId;
    socket.presenceId = getPresenceId(userId, socket.id);

    const role =
      room.hostId && room.hostId.toString() === userId?.toString()
        ? "Host"
        : "Participant";

    const participant = {
      id: userId,
      presenceId: socket.presenceId,
      socketId: socket.id,
      name: userName,
      role,
      status: "online",
      lastSeen: null,
    };

    roomData.participants[socket.id] = participant;
    roomData.presence[socket.presenceId] = participant;
    socket.emit("presence:self", { presenceId: socket.presenceId });

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

    broadcastPresence(io, roomId);

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
    handleSocketDeparture(io, socket, roomId, userName);
  });

  // --- SEND MESSAGE ---
  socket.on("sendMessage", (data) => {
    const { roomId, userName, message, imageUrl, timestamp } = data;
    const roomData = activeRooms[roomId];
    if (!roomData) {
      socket.emit("errorMessage", "Room not found");
      return;
    }

    const messageId = data.messageId || crypto.randomUUID();
    const senderPresenceId =
      socket.presenceId || getPresenceId(socket.userId, socket.id);
    const onlineRecipients = Object.values(roomData.participants).filter(
      (participant) => participant.socketId !== socket.id
    );
    const status = onlineRecipients.length > 0 ? "delivered" : "sent";

    roomData.messages[messageId] = {
      id: messageId,
      senderPresenceId,
      status,
      seenBy: {},
      deliveredTo: Object.fromEntries(
        onlineRecipients.map((participant) => [
          participant.presenceId,
          new Date().toISOString(),
        ])
      ),
    };

    io.to(roomId).emit("receiveMessage", {
      id: messageId,
      senderPresenceId,
      userName,
      message: message || "",
      imageUrl: imageUrl || null,
      timestamp: timestamp || new Date(),
      status,
    });

    socket.emit("messageStatusUpdated", {
      messageId,
      status,
      deliveredTo: Object.keys(roomData.messages[messageId].deliveredTo),
      seenBy: [],
    });
  });

  // --- TYPING PRESENCE ---
  socket.on("typing:start", ({ roomId }) => {
    const roomData = activeRooms[roomId];
    const participant = roomData?.participants[socket.id];
    if (!roomData || !participant) return;

    roomData.typing[participant.presenceId] = {
      presenceId: participant.presenceId,
      name: participant.name,
      socketId: socket.id,
      updatedAt: new Date().toISOString(),
    };

    broadcastTyping(io, roomId);
  });

  socket.on("typing:stop", ({ roomId }) => {
    const roomData = activeRooms[roomId];
    const participant = roomData?.participants[socket.id];
    if (!roomData || !participant) return;

    delete roomData.typing[participant.presenceId];
    broadcastTyping(io, roomId);
  });

  // --- DELIVERY AND READ RECEIPTS ---
  socket.on("messageDelivered", ({ roomId, messageId }) => {
    updateMessageReceipt(io, socket, roomId, messageId, "delivered");
  });

  socket.on("messageSeen", ({ roomId, messageId }) => {
    updateMessageReceipt(io, socket, roomId, messageId, "seen");
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
    handleSocketDeparture(io, socket, roomId);
  });
});

// Helper: Format session time

function createRoomState() {
  return {
    participants: {},
    presence: {},
    typing: {},
    messages: {},
    timer: null,
    hostId: null,
  };
}

function getPresenceId(userId, socketId) {
  return userId ? `user:${userId}` : `guest:${socketId}`;
}

function broadcastPresence(io, roomId) {
  const roomData = activeRooms[roomId];
  if (!roomData) return;
  io.to(roomId).emit("updateParticipants", Object.values(roomData.presence));
  io.to(roomId).emit("presenceUpdated", Object.values(roomData.presence));
}

function broadcastTyping(io, roomId) {
  const roomData = activeRooms[roomId];
  if (!roomData) return;
  io.to(roomId).emit("typing:update", Object.values(roomData.typing));
}

function handleSocketDeparture(io, socket, roomId, explicitUserName) {
  const roomData = activeRooms[roomId];
  if (!roomId || !roomData?.participants[socket.id]) return;

  const participant = roomData.participants[socket.id];
  const lastSeen = new Date().toISOString();

  delete roomData.participants[socket.id];
  delete roomData.typing[participant.presenceId];

  roomData.presence[participant.presenceId] = {
    ...participant,
    status: "offline",
    lastSeen,
  };

  broadcastPresence(io, roomId);
  broadcastTyping(io, roomId);

  const displayName = explicitUserName || participant.name;
  if (displayName) {
    socket.to(roomId).emit("userLeft", `${displayName} left the chat`);
  }

  const onlineCount = Object.keys(roomData.participants).length;
  if (onlineCount === 0) {
    if (roomData.timer) clearInterval(roomData.timer);
    delete activeRooms[roomId];
  }

  socket.leave(roomId);
}

function updateMessageReceipt(io, socket, roomId, messageId, receiptType) {
  const roomData = activeRooms[roomId];
  const participant = roomData?.participants[socket.id];
  const messageState = roomData?.messages[messageId];
  if (!roomData || !participant || !messageState) return;

  const now = new Date().toISOString();

  if (receiptType === "delivered") {
    messageState.deliveredTo[participant.presenceId] = now;
  }

  if (receiptType === "seen") {
    messageState.deliveredTo[participant.presenceId] = now;
    messageState.seenBy[participant.presenceId] = now;
  }

  const nextStatus =
    Object.keys(messageState.seenBy).length > 0
      ? "seen"
      : Object.keys(messageState.deliveredTo).length > 0
      ? "delivered"
      : "sent";

  messageState.status = nextStatus;

  const senderSocket = Object.values(roomData.participants).find(
    (activeParticipant) =>
      activeParticipant.presenceId === messageState.senderPresenceId
  );

  if (senderSocket) {
    io.to(senderSocket.socketId).emit("messageStatusUpdated", {
      messageId,
      status: nextStatus,
      deliveredTo: Object.keys(messageState.deliveredTo),
      seenBy: Object.keys(messageState.seenBy),
    });
  }
}

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
