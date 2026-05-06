import mongoose, { mongo, Schema } from "mongoose";

const roomSchema = new mongoose.Schema({
  roomName: { type: String, required: true },
  roomId: { type: String, required: true, unique: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  description: { type: String, required: true },
  allowImages: { type: Boolean, default: false },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  maxParticipants: { type: Number, default: 5 },
  expiryTime: { type: Number, default: 0, required: true },
});

const roomModel = mongoose.models.room || mongoose.model("room", roomSchema);

export default roomModel;
