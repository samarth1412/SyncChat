import React, { useState } from "react";
import { X, Copy, Mail } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const InviteModal = ({ isOpen, onClose, roomInfo }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const shareableLink = `${window.location.origin}/room/${roomInfo?.meetingId}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage("Copied to clipboard!");
    setTimeout(() => setMessage(""), 3000);
  };

  const sendInviteEmail = async () => {
    if (!email.trim()) {
      setMessage("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/room/send-invite/${
          roomInfo.meetingId
        }`,
        { email: email.trim() }
      );

      if (response.data.success) {
        setMessage("Invite sent successfully!");
        setEmail("");
      } else {
        setMessage(response.data.message || "Failed to send invite");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send invite");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendInviteEmail();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl z-10"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="h-12 sm:h-20 flex items-center justify-center mb-1">
                <img
                  src="/syncchat_full_logo.svg"
                  alt="SyncChat"
                  className="h-12 sm:h-20"
                />
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                Invite to <span className="text-[#9074DB]">Chatroom</span>
              </h2>
              <p className="text-xs text-gray-500">
                Share this link or invite others via email
              </p>
            </div>

            <div className="rounded-xl sm:border-2 sm:p-4 border-gray-200">
              {/* Room ID section */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">
                  Room ID
                </label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <input
                    type="text"
                    value={roomInfo?.meetingId}
                    readOnly
                    className="flex-1 bg-transparent text-gray-500 text-xs sm:text-sm focus:outline-none font-mono"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyToClipboard(roomInfo?.meetingId)}
                    className="flex items-center gap-1 bg-[#9074DB] text-white px-3 py-1.5 rounded-lg hover:bg-[#7B5FCA] transition-colors text-xs"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </motion.button>
                </div>
              </div>

              {/* Email section */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">
                  Invite by Email
                </label>
                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="emailaddress@gmail.com"
                    className="flex-1 bg-transparent p-3 text-gray-600 text-xs sm:text-sm focus:outline-none"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendInviteEmail}
                    disabled={loading}
                    className="flex items-center gap-1 bg-[#9074DB] text-white px-4 py-2 rounded-lg hover:bg-[#7B5FCA] transition-colors text-sm disabled:opacity-50"
                  >
                    {loading ? "..." : <Mail className="h-4 w-4" />}
                  </motion.button>
                </div>
              </div>

              {/* Shareable link */}
              <div className="mb-4">
                <label className="block text-xs sm:text-sm font-medium text-black mb-2">
                  Shareable Link
                </label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <input
                    type="text"
                    value={shareableLink}
                    readOnly
                    className="flex-1 bg-transparent text-gray-500 text-xs sm:text-sm focus:outline-none truncate"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => copyToClipboard(shareableLink)}
                    className="flex items-center gap-1 bg-[#9074DB] text-white px-3 py-1.5 rounded-lg hover:bg-[#7B5FCA] transition-colors text-xs"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </motion.button>
                </div>
              </div>

              {/* Status message */}
              <AnimatePresence mode="wait">
                {message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`text-xs text-center py-2 rounded-lg mt-2 ${
                      message.includes("success") || message.includes("Copied")
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InviteModal;
