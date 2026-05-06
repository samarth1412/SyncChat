import roomModel from "../models/roomModel.js";
import userModel from "../models/userModels.js";
import { generateRoomId } from "../utils/idGenerator.js";
import transporter from "../config/nodeMailer.js";
import { getActiveRoomCount } from "../socket/stateManager.js";

export const createRoom = async (req, res) => {
  const DEFAULT_DURATION_TIME = 30; // default duration in minutes
  const hostId = req.userId;

  const {
    roomName,
    description,
    allowImages,
    durationMinutes,
    maxParticipants,
  } = req.body;

  if (!roomName || !description) {
    return res.status(400).json({
      success: false,
      message: "Room name and description are required!",
    });
  }

  try {
    const uniqueRoomId = generateRoomId(6); // generate unique roomId
    const durationMs = (durationMinutes || DEFAULT_DURATION_TIME) * 60 * 1000;
    const expiryTime = Date.now() + durationMs;

    // Create the new room document
    const newRoom = new roomModel({
      roomName,
      description,
      roomId: uniqueRoomId,
      hostId: hostId,
      allowImages: allowImages || false,
      maxParticipants,
      expiryTime,
      participants: [hostId],
    });

    await newRoom.save();

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: {
        roomName: newRoom.roomName,
        roomId: newRoom.roomId,
        expiryTime: newRoom.expiryTime,
      },
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating room.",
    });
  }
};

export const getRoomDetails = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.json({ success: false, message: "Room Id is required" });
  }

  try {
    const room = await roomModel
      .findOne({ roomId: id })
      .populate("hostId", "name email");

    if (!room) {
      return res.json({ success: false, message: "Room not found!" });
    }

    if (room.expiryTime < Date.now()) {
      return res.json({ success: false, message: "Room has expired" });
    }

    return res.json({
      success: true,
      room: {
        id: room.roomId,
        name: room.roomName,
        host: room.hostId,
        description: room.description,
        participants: room.participants,
        expiryTime: room.expiryTime,
        maxParticipants: room.maxParticipants,
        allowImages: room.allowImages,
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const joinRoom = async (req, res) => {
  const { userName, roomId } = req.body;

  if (!userName || !roomId) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }

  try {
    const room = await roomModel.findOne({
      roomId: { $regex: new RegExp(`^${roomId}$`, "i") },
    });

    if (!room || room.expiryTime < Date.now()) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    //implement the maxParticipant count using socket.io here after configuring it
    const currentTotalParticipants = getActiveRoomCount(room.roomId);
    if (
      room.maxParticipants > 0 &&
      currentTotalParticipants >= room.maxParticipants
    ) {
      return res.status(403).json({ success: false, message: "Room is full" });
    }

    return res.json({
      success: true,
      message: `Welcome, ${userName}`,
      isGuest: true,
      userName: userName,
      roomId: room.roomId,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  const { id: roomId } = req.params;
  const hostId = req.userId;

  if (!roomId) {
    return res
      .status(400)
      .json({ success: false, message: "Room ID required" });
  }

  if (!hostId) {
    return res.status(401).json({
      success: false,
      message: "You must be authenticated to close a session.",
    });
  }

  try {
    const room = await roomModel.findOne({ roomId: roomId });

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    if (room.hostId.toString() !== hostId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the room host can close a session",
        hostId: room.hostId,
      });
    }

    // Delete the room document
    await roomModel.deleteOne({ roomId: roomId });

    return res.status(200).json({
      success: true,
      message: `Session ${room.roomName} has been ended. ID:${room.roomId}`,
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" }); // 500 Internal Server Error
  }
};

export const sendEmail = async (req, res) => {
  const { email } = req.body;
  const { roomId } = req.params;

  if (!email || !roomId) {
    return res.status(400).json({ success: false, message: "Missing details" });
  }

  try {
    const room = await roomModel
      .findOne({ roomId: roomId })
      .populate("hostId", "name");

    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: `SyncChat temporary chatroom invitation`,
      text: `You are invited to ${room.roomName} hosted by ${room.hostId.name}. This is your RoomId: ${room.roomId}`,
    };

    await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      message: "Invitation email sent successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
