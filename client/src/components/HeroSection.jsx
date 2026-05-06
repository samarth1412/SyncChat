import React, { useContext } from "react";
import AppContext from "../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { useState } from "react";
import JoinRoomModal from "./JoinRoomModal.jsx";
import { motion } from "framer-motion";

const HeroSection = () => {
  const navigate = useNavigate();
  const { userData, backendUrl, setIsLoggedIn, setUserData } =
    useContext(AppContext);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const logOut = async () => {
    try {
      const { data } = await axios.post(backendUrl + "/api/auth/logout");
      data.success && setIsLoggedIn(false);
      data.success && setUserData(false);
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendVerificationOtp = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(
        backendUrl + "/api/auth/send-verify-otp"
      );
      if (data.success) {
        navigate("/email-verify");
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };
  const handleJoinRoom = () => {
    setShowJoinModal(true);
  };

  return (
    <div className="absolute inset-0 -z-10 min-h-screen w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-size-[16px_16px]">
      {/* Navbar */}
      <motion.section
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="w-full flex justify-between items-center p-4 sm:px-20">
          {/* Logo */}
          <div className="flex justify-between items-center w-full">
            <div className="cursor-pointer">
              <img
                src="/syncchat_full_logo.svg"
                alt="SyncChat"
                className="w-32 sm:w-36 h-auto"
              />
            </div>
            {/*Mobile view*/}
            <div className="cursor-pointer font-medium sm:hidden text-sm hover:text-ghost">
              {userData ? (
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer relative group ">
                  <img src="/avatar.png" alt="Avatar" />
                  <div className="absolute hidden group-hover:block top-0 right-o z-10 text-black rounded-3xl pt-10">
                    <ul className="list-none m-0 p-2 bg-gray-100 text-sm">
                      {!userData.isAccountVerified && (
                        <li
                          onClick={sendVerificationOtp}
                          className="py-1 px-2 hover:bg-gray-200 cursor-pointer"
                        >
                          Verify Email
                        </li>
                      )}
                      <li
                        onClick={logOut}
                        className="py-1 px-2 hover:bg-gray-200 cursor-pointer pr-10"
                      >
                        LogOut
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="cursor-pointer text-sm hover:text-ghost"
                >
                  Login
                </button>
              )}
            </div>
          </div>

          {/* Nav Links (hidden on mobile) */}
          <div className="hidden sm:flex w-full justify-end items-center gap-8 text-[#2c2c2c]">
            <motion.button
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.5 }}
              className="cursor-pointer text-sm hover:text-ghost"
              onClick={() => navigate("/create-chatroom")}
            >
              Create a Room
            </motion.button>
            <motion.button
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.5 }}
              onClick={handleJoinRoom}
              className="cursor-pointer text-sm hover:text-ghost"
            >
              Join a Room
            </motion.button>

            {userData ? (
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center cursor-pointer relative group ">
                <motion.img
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                  src="/avatar.png"
                  alt="Avatar"
                />
                <div className="absolute hidden group-hover:block top-0 right-o z-10 text-black rounded-3xl pt-10">
                  <ul className="list-none m-0 p-2 bg-gray-100 text-sm">
                    {!userData.isAccountVerified && (
                      <li
                        onClick={sendVerificationOtp}
                        className="py-1 px-2 hover:bg-gray-200 cursor-pointer"
                      >
                        Verify Email
                      </li>
                    )}
                    <li
                      onClick={logOut}
                      className="py-1 px-2 hover:bg-gray-200 cursor-pointer pr-10"
                    >
                      LogOut
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <motion.button
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.5 }}
                onClick={() => navigate("/login")}
                className="cursor-pointer text-sm hover:text-ghost"
              >
                Login
              </motion.button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Hero Section */}
      <section className="flex  lg:flex-row gap-10 sm:px-10 p-4 items-center text-center sm:text-left">
        {/* Left Side (Text) */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full lg:w-5/12 sm:ml-20"
        >
          <motion.h1 className="text-3xl sm:text-4xl font-semibold leading-snug sm:leading-11 mt-10 md:mt-10 lg:-mt-10">
            Create Instant <span className="text-ghost">Chatrooms</span>{" "}
            <br className="hidden sm:block" />
            For Events, Friends <br className="hidden sm:block" /> or Teams
          </motion.h1>
          <h2 className="text-gray-600 mt-3 text-sm sm:text-md max-w-md mx-auto sm:mx-0">
            Create temporary chatrooms, share a link or QR, and chat instantly
            with anyone, no signup needed.
          </h2>

          <div className="flex flex-col sm:flex-row gap-6 mt-5 justify-center sm:justify-start">
            <motion.button
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="bg-ghost text-sm text-white p-2 px-4 rounded-xl w-auto sm:w-45 cursor-pointer"
              onClick={() => navigate("/create-chatroom")}
            >
              Create a Chatroom
            </motion.button>
            <motion.button
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.5 }}
              onClick={handleJoinRoom}
              className="bg-ghost text-sm text-white p-2 px-4 rounded-xl w-auto sm:w-45 cursor-pointer"
            >
              Join a Chatroom
            </motion.button>
          </div>
        </motion.div>

        {/* Right Side (Image) — hidden on small screens, BIGGER now */}
        <motion.div
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full lg:w-7/12 h-auto hidden lg:block "
        >
          <motion.img
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            src="/hero_bg.png"
            alt="hero_bg"
            className="w-full h-auto scale-110 lg:scale-105"
          />
        </motion.div>
      </section>
      {/* Join Room Modal */}

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
};

export default HeroSection;
