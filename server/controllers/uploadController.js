import roomModel from "../models/roomModel.js";

export const uploadPhoto = async (req, res) => {
  const { roomId } = req.body;

  try {
    // Find the room through roomId
    const room = await roomModel.findOne({ roomId });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: "Room not found",
      });
    }

    // Check if uploads are allowed (use allowImages from your schema)
    if (!room.allowImages) {
      return res.status(403).json({
        success: false,
        error: "File uploads are disabled for this room.",
      });
    }

    // Check if file was uploaded
    if (!req.file || !req.file.path) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded!",
      });
    }

    const imageUrl = req.file.path; // Cloudinary URL

    console.log("Upload successful:", imageUrl);

    res.json({
      success: true,
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({
      success: false,
      error: "Image upload failed",
    });
  }
};
