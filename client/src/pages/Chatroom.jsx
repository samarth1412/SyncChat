import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Send, Menu, X } from "lucide-react";
import InviteModal from "../components/InviteModal";
import { toast } from "react-toastify";
import { Upload } from "lucide-react";
import { useContext } from "react";
import axios from "axios";
import AppContext from "../context/AppContext";
import { AnimatePresence, motion } from "framer-motion";

const Chatroom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Guest";
  const userId = localStorage.getItem("userId");
  //get backendurl from global state manager
  const { backendUrl } = useContext(AppContext);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [allowUploads, setAllowUploads] = useState(false);
  const [roomInfo, setRoomInfo] = useState({
    name: "",
    meetingId: "",
    sessionTime: "00:00:00",
    hostId: null,
  });
  const [socket, setSocket] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => scrollToBottom(), [messages]);

  // Listen for roomInfo from server
  useEffect(() => {
    if (!socket) return;

    socket.on("roomInfo", (info) => {
      setAllowUploads(info.allowUploads);
    });

    return () => socket.off("roomInfo");
  }, [socket]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size is < 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("roomId", roomId);

    console.log("Uploading image...");

    try {
      const res = await axios.post(`${backendUrl}/api/upload/photo`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res.data;

      if (data.success && data.url) {
        // Emit the image as a chat message
        socket.emit("sendMessage", {
          roomId,
          userName,
          imageUrl: data.url,
          timestamp: new Date(),
        });
        toast.success("Image uploaded successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Image upload failed");
    }
  };

  // Initialize socket
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL);
    setSocket(newSocket);

    newSocket.emit("joinRoom", roomId, userName, userId);

    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleUserJoined = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          userName: "System",
          message: msg,
          isSystem: true,
          timestamp: new Date(),
        },
      ]);
    };

    const handleUserLeft = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          userName: "System",
          message: msg,
          isSystem: true,
          timestamp: new Date(),
        },
      ]);
    };

    const handleUpdateParticipants = (list) => {
      // Filter out any null or malformed users
      const validList = (list || []).filter(
        (p) => p && typeof p === "object" && p.name
      );

      // Force React re-render with fresh array instance
      setTimeout(() => {
        setParticipants([...validList]);
      }, 100);
    };

    const handleRoomInfo = (info) => {
      setRoomInfo(info);
    };

    const handleSessionTimer = (time) => {
      setRoomInfo((prev) => ({ ...prev, sessionTime: time }));
    };

    const handleSessionEnded = () => {
      toast.info("Session has ended!");
      navigate("/");
    };

    //Attach listeners
    newSocket.on("receiveMessage", handleReceiveMessage);
    newSocket.on("userJoined", handleUserJoined);
    newSocket.on("userLeft", handleUserLeft);
    newSocket.on("updateParticipants", handleUpdateParticipants);
    newSocket.on("roomInfo", handleRoomInfo);
    newSocket.on("sessionTimer", handleSessionTimer);
    newSocket.on("sessionEnded", handleSessionEnded);

    //Handle roomFull event
    const handleRoomFull = (data) => {
      toast.error(data.message || "Room is full. Cannot join.");
      navigate("/"); // redirect user to home or previous page
    };
    newSocket.on("roomFull", handleRoomFull);

    //Cleanup function - remove ALL listeners
    return () => {
      newSocket.off("receiveMessage", handleReceiveMessage);
      newSocket.off("userJoined", handleUserJoined);
      newSocket.off("userLeft", handleUserLeft);
      newSocket.off("updateParticipants", handleUpdateParticipants);
      newSocket.off("roomInfo", handleRoomInfo);
      newSocket.off("sessionTimer", handleSessionTimer);
      newSocket.off("sessionEnded", handleSessionEnded);

      newSocket.emit("leaveRoom", roomId, userName);
      newSocket.disconnect();
    };
  }, [roomId, userName, userId, navigate]);

  const sendMessage = () => {
    if (!message.trim() || !socket) return;

    const messageData = {
      roomId,
      userName,
      message: message.trim(),
      timestamp: new Date(),
    };

    socket.emit("sendMessage", messageData);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const inviteParticipants = () => {
    setShowInviteModal(true);
    setShowMobileSidebar(false);
  };

  const closeSession = () => {
    if (window.confirm("Are you sure you want to close this session?")) {
      socket.emit("closeSession", roomId);
      navigate("/");
    }
  };

  const logOut = () => {
    if (socket) {
      socket.emit("leaveRoom", roomId, userName);
      setTimeout(() => {
        socket.disconnect();
        navigate("/");
      }, 1000);
    } else {
      navigate("/");
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const isHost = roomInfo.hostId === userId;

  return (
    <>
      <div className="flex h-screen bg-[#F1EEFB] overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:w-64 bg-white border-r sm:m-5 sm:ml-7 rounded-2xl border-gray-200 flex-col">
          <div className="p-4 border-b border-gray-200">
            <img
              src="/syncchat_black.svg"
              alt="SyncChat logo"
              className="h-6 w-auto cursor-pointer"
              onClick={() => navigate("/")}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {participants.length === 0 ? (
              <p className="text-xs text-gray-400 text-center">
                No participants yet
              </p>
            ) : (
              participants.map((p, i) => (
                <div
                  key={`${p.id || p.socketId}-${i}`}
                  className="flex items-center gap-3 mb-4"
                >
                  <img src="/avatar.png" alt="avatar" className="h-12" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.name
                        ? p.name.charAt(0).toUpperCase() + p.name.slice(1)
                        : "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">{p.role}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 space-y-2 border-t border-gray-200">
            <button
              onClick={inviteParticipants}
              className="w-full bg-[#9074DB] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#7B5FCA] transition-colors"
            >
              Invite Participants
            </button>

            {isHost ? (
              <button
                onClick={closeSession}
                className="w-full bg-[#C92225] text-white py-3 text-sm rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Close the Session ({roomInfo.sessionTime})
              </button>
            ) : (
              <button
                onClick={logOut}
                className="w-full bg-[#C92225] text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                Log Out
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {showMobileSidebar && (
            <div className="fixed inset-0 z-50 md:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={() => setShowMobileSidebar(false)}
              />

              <motion.div
                initial={{ x: "-100%" }} // Start off-screen to the left
                animate={{ x: 0 }} // Slide in to position
                exit={{ x: "-100%" }} // Slide back out on close
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col z-10"
              >
                {/* Mobile Sidebar Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <img
                    src="/syncchat_black.svg"
                    alt="SyncChat logo"
                    className="h-6 w-auto"
                  />
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Participants List */}
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                    Participants ({participants.length})
                  </h3>
                  {participants.map((p, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={i}
                      className="flex items-center gap-3 mb-4"
                    >
                      <img src="/avatar.png" alt="avatar" className="h-10" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {p.name &&
                            p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                        </p>
                        <p className="text-xs text-gray-500">{p.role}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Mobile Action Buttons */}
                <div className="p-4 space-y-2 border-t border-gray-200">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={inviteParticipants}
                    className="w-full bg-[#9074DB] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#7B5FCA] transition-colors"
                  >
                    Invite Participants
                  </motion.button>

                  {isHost ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={closeSession}
                      className="w-full bg-[#C92225] text-white py-3 text-sm rounded-lg font-medium hover:bg-red-600 transition-colors"
                    >
                      Close Session ({roomInfo.sessionTime})
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={logOut}
                      className="w-full bg-[#C92225] text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Log Out
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col h-screen">
          {/* Mobile header */}
          <div className="md:hidden bg-white border-b border-gray-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/syncchat_black.svg"
                alt="SyncChat logo"
                className="h-6 w-auto"
              />
            </div>
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Desktop header */}
          <div className="hidden md:flex bg-white border-b border-gray-200 p-2 mt-5 mr-7 ml-2 rounded-2xl items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <img src="/people.png" alt="people" className="h-5 ml-1" />
              <h1 className="text-base sm:text-md font-medium text-gray-500">
                {roomInfo.name || "Chatroom"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 pr-3">
                Meeting ID: {roomInfo.meetingId}
              </span>
            </div>
          </div>

          {/* Mobile room info */}
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <img src="/people.png" alt="people" className="h-4" />
                <h1 className="text-sm font-medium text-gray-700">
                  {roomInfo.name || "Chatroom"}
                </h1>
              </div>
              <span className="text-xs text-gray-500">
                ID: {roomInfo.meetingId}
              </span>
            </div>
          </div>

          {/* Messages container */}
          <div className="flex-1 flex flex-col bg-white mt-0 md:mt-5 mr-0 md:mr-7 ml-0 md:ml-2 mb-0 md:mb-5 md:rounded-2xl overflow-hidden min-h-0">
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 scrollbar-hide min-h-0">
              <div className="w-full mx-auto space-y-3 sm:space-y-4">
                {messages.map((msg, i) => (
                  <div key={i}>
                    {msg.isSystem ? (
                      <div className="text-center text-xs text-gray-500 my-2">
                        {msg.message}
                      </div>
                    ) : msg.userName === userName ? (
                      //Your message (on right)
                      <div className="flex justify-end">
                        <div className="max-w-[75%] sm:max-w-md">
                          {msg.imageUrl ? (
                            <div className="flex justify-center">
                              <img
                                src={msg.imageUrl}
                                alt="Uploaded"
                                className="max-w-40 rounded-lg shadow"
                              />
                            </div>
                          ) : (
                            <div className="bg-[#9074DB] text-white px-3 sm:px-4 py-2 rounded-2xl rounded-tr-sm">
                              <p className="text-xs sm:text-sm wrap-break-word">
                                {msg.message}
                              </p>
                            </div>
                          )}

                          <p className="text-xs text-gray-500 mt-1 text-right">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                        <img
                          src="/avatar.png"
                          alt="avatar"
                          className="h-7 sm:h-8 ml-1"
                        />
                      </div>
                    ) : (
                      // Other user's message (on left)
                      <div className="flex items-start gap-2">
                        <img
                          src="/avatar.png"
                          alt="avatar"
                          className="h-7 sm:h-8"
                        />
                        <div className="max-w-[75%] sm:max-w-md">
                          <div
                            className={`px-3 sm:px-4 py-2 rounded-2xl rounded-tl-sm shadow-sm ${
                              msg.ImageUrl ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <p className="text-xs font-medium text-[#9074DB] mb-1">
                              {msg.userName}
                            </p>

                            {msg.imageUrl ? (
                              <div className="flex justify-center">
                                <img
                                  src={msg.imageUrl}
                                  alt="Uploaded"
                                  className="max-w-40 bg-white rounded-lg shadow"
                                />
                              </div>
                            ) : (
                              <p className="text-xs sm:text-sm text-gray-900 wrap-break-word">
                                {msg.message}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 p-3 sm:p-4 bg-white shrink-0">
              <div className="flex items-center w-full gap-2 sm:gap-3">
                {allowUploads && (
                  <label htmlFor="photoUpload" className="cursor-pointer">
                    <Upload className="h-4 sm:h-5 " />
                    <input
                      type="file"
                      id="photoUpload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Message"
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#9074DB] text-xs sm:text-sm placeholder:text-gray-400"
                />
                <button
                  onClick={sendMessage}
                  className="p-2.5 sm:p-2 bg-[#9074DB] text-white rounded-full hover:bg-[#7B5FCA] transition-colors flex items-center justify-center shrink-0"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomInfo={roomInfo}
      />
    </>
  );
};

export default Chatroom;
