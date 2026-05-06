import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const JoinRoomModal = ({ isOpen, onClose }) => {
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!userName.trim() || !roomId.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        import.meta.env.VITE_BACKEND_URL + "/api/room/join",
        {
          userName: userName.trim(),
          roomId: roomId.trim().toUpperCase(),
        }
      );

      if (response.data.success) {
        localStorage.setItem("userName", response.data.userName);
        localStorage.setItem("isGuest", "true");
        if (!localStorage.getItem("userId")) {
          localStorage.setItem("userId", `guest-${Date.now()}`);
        }
        navigate(`/room/${response.data.roomId}`);
      } else {
        setError(response.data.message || "Failed to join room");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUserName("");
    setRoomId("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center  justify-center p-3 sm:p-4">
          {/* Backdrop fades in when join room clicked*/}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
          />

          {/* Modal scale with fade in animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl z-10"
          >
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                Join Chatroom
              </h2>
              <p className="text-sm text-gray-500">
                Enter room ID to join the chat
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-4 sm:space-y-5">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter a username"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#9074DB] transition-all"
                disabled={loading}
              />
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="ROOM-ID"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#9074DB] transition-all uppercase font-mono"
                disabled={loading}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:w-auto px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:flex-1 px-6 py-3 bg-[#9074DB] text-white rounded-xl font-medium hover:bg-[#7B5FCA] transition-all text-sm disabled:opacity-50"
                >
                  {loading ? "Joining..." : "Join"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JoinRoomModal;
