import transporter from "../config/nodeMailer.js";
import roomModel from "../models/roomModel.js";
import path from "path";
import { fileURLToPath } from "url";

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sendInviteEmail = async (req, res) => {
  const { email } = req.body;
  const { roomId } = req.params;

  if (!email || !roomId) {
    return res.status(400).json({
      success: false,
      message: "Email and room ID are required",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email address",
    });
  }

  try {
    const room = await roomModel.findOne({ roomId }).populate("hostId", "name");

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const shareableLink = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/room/${room.roomId}`;

    const logoPath = path.join(__dirname, "../assets/syncchat_mono_logo.svg");

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: `You're invited to join ${
        room.roomName || "a SyncChat chatroom session"
      }!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SyncChat Invitation</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F1EEFB;">
            <div style="max-width: 600px; margin: 40px auto; background-color: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

              <div style="background: linear-gradient(135deg, #9074DB 0%, #7B5FCA 100%); padding: 40px 20px; text-align: center;">
                <div style=" width: 80px; height: 100px; margin: 0 auto 20px; border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                  <img src="cid:syncchatlogo" alt="SyncChat Logo" style="width: auto; height: 100px;" />
                </div>
                <h1 style="color: white; margin: 0; font-size: 25px; font-weight: bold;">You're Invited to SyncChat!</h1>
              </div>

              <div style="padding: 40px 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  <strong>${
                    room.hostId?.name || "User"
                  }</strong> has invited you to join a SyncChat session:
                </p>
                
                <div style="background-color: #F9F7FD; border-left: 4px solid #9074DB; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Room Name:</p>
                  <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold;">${
                    room.roomName || "SyncChat Session"
                  }</p>
                </div>

                <div style="background-color: #F9F7FD; border-left: 4px solid #9074DB; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Meeting ID:</p>
                  <p style="margin: 0; color: #333; font-size: 18px; font-weight: bold; font-family: monospace;">${
                    room.roomId
                  }</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${shareableLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #9074DB 0%, #7B5FCA 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(144,116,219,0.3);">
                    Join Session Now
                  </a>
                </div>

                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                  Or copy and paste this link into your browser:
                </p>
                <div style="background-color: #F3F4F6; padding: 12px; border-radius: 8px; margin: 10px 0; word-break: break-all;">
                  <a href="${shareableLink}" style="color: #9074DB; text-decoration: none; font-size: 14px;">${shareableLink}</a>
                </div>
              </div>

              <div style="background-color: #F9F7FD; padding: 30px; text-align: center; border-top: 1px solid #E5E7EB;">
                <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                  SyncChat - Connect, Chat, Collaborate
                </p>
                <p style="color: #999; font-size: 12px; margin: 0;">
                  This is an automated email. Please do not reply.
                </p>
              </div>

            </div>
          </body>
        </html>
      `,
      text: `You are invited to ${room.roomName} hosted by ${room.hostId?.name}. Room ID: ${room.roomId}. Join here: ${shareableLink}`,
      attachments: [
        {
          filename: "syncchat_mono_logo.svg",
          path: logoPath,
          cid: "syncchatlogo",
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Invitation email sent successfully",
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email. " + error.message,
    });
  }
};
