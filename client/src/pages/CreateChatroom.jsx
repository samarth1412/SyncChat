import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppContext from "../context/AppContext";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const CreateChatroom = () => {
  const navigate = useNavigate();
  const { backendUrl, isLoggedIn, loading } = useContext(AppContext);

  const [roomName, setRoomName] = useState("");
  const [description, setDescription] = useState("");
  const [allowImages, setAllowImages] = useState(false);
  const [duration, setDuration] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  useEffect(() => {
    // Only redirect if the authentication check is finished and user is not logged in
    if (!loading && !isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, loading, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-[#9074DB] font-medium text-lg">
          Verifying session...
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!isLoggedIn) {
        toast.error("You must be logged in to create a chatroom.");
        navigate("/login");
        return;
      }

      const chatRoomData = {
        roomName,
        description,
        allowImages,
        durationMinutes: duration,
        maxParticipants: maxParticipants || 10,
      };

      const { data } = await axios.post(
        backendUrl + "/api/room/create",
        chatRoomData,
        { withCredentials: true }
      );

      if (data.success) {
        toast.success(data.message || "Chatroom created successfully!");
        navigate(`/room/${data.room.roomId}`);
      } else {
        toast.error(data.message || "Failed to create the chatroom!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred.");
    }
  };

  return (
    <div className="flex min-h-screen overflow-hidden">
      {/* Left side - Illustration sidebar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden lg:flex lg:w-1/3 bg-[#9d84dd] rounded-r-4xl items-center justify-center relative overflow-hidden"
      >
        <img
          src="/syncchat_mono_logo.svg"
          alt="SyncChat Logo"
          className="absolute left-15 top-3 h-30 cursor-pointer"
          onClick={() => navigate("/")}
        />
        <motion.img
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          src="create_room_bg.png"
          alt="Chat Illustration"
          className="w-3/4 max-w-md"
        />
      </motion.div>

      {/* Right side - form container */}
      <div className="w-full lg:w-2/3 bg-gray-50 flex items-center justify-center p-6 sm:p-8 relative">
        {/* Mobile logo */}
        <img
          src="/syncchat_full_logo.svg"
          alt="SyncChat Logo"
          className="lg:hidden absolute left-6 top-6 h-15 cursor-pointer"
          onClick={() => navigate("/")}
        />

        {/* Profile icon */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute right-6 top-10 w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer"
        >
          <img src="/avatar.png" alt="Avatar" />
        </motion.div>

        {/* Animated form card */}
        <motion.form
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md mt-8 sm:mt-0"
        >
          <div className="mb-6">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
              Set Up Your
            </h1>
            <h2 className="text-xl sm:text-3xl font-bold text-[#9074DB]">
              Chatroom
            </h2>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none placeholder:text-gray-500 focus:border-[#9074DB] focus:ring-2 focus:ring-[#9074DB]/20 transition-all text-sm"
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none placeholder:text-gray-500 focus:border-[#9074DB] focus:ring-2 focus:ring-[#9074DB]/20 transition-all text-sm resize-none"
            />

            <div className="flex items-center justify-between px-1">
              <span className="text-xs sm:text-sm text-gray-500">
                Allow images
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowImages}
                  onChange={(e) => setAllowImages(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9074DB]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#9074DB] text-xs sm:text-sm text-gray-500 bg-white"
              >
                <option value="">Choose duration</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>

              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#9074DB] text-xs sm:text-sm text-gray-500 bg-white"
              >
                <option value="0">Max participants</option>
                <option value="10">10 people</option>
                <option value="50">50 people</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full text-white rounded-xl py-3 bg-[#9074DB] hover:bg-[#7B5FCA] transition-colors duration-200 font-medium shadow-lg text-sm sm:text-base mt-2"
            >
              Create a chatroom
            </motion.button>
          </div>
        </motion.form>
      </div>
    </div>
  );
};

export default CreateChatroom;
