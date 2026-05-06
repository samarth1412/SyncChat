import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AppContext from "../context/AppContext.jsx";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, setIsLoggedIn, getUserData } = useContext(AppContext);

  const [userState, setUserState] = useState("Login"); // "Login" or "Sign Up"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    axios.defaults.withCredentials = true;

    try {
      if (userState === "Sign Up") {
        const { data } = await axios.post(`${backendUrl}/api/auth/register`, {
          name,
          email,
          password,
        });

        if (data.success) {
          // Store user data in localStorage
          if (data.user) {
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("userName", data.user.name);
            console.log("Stored userId:", data.user.id);
          }

          setIsLoggedIn(true);
          getUserData();
          navigate("/");
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/auth/login`, {
          email,
          password,
        });

        if (data.success) {
          // Store user data in localStorage
          if (data.user) {
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("userName", data.user.name);
            console.log("Stored userId:", data.user.id);
          }

          setIsLoggedIn(true);
          getUserData();
          navigate("/");
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="bg-ghost min-h-screen flex justify-center items-center p-3 sm:p-5">
      {/* Top logo */}
      <div className="absolute -top-4 md:block hidden">
        <img
          src="/syncchat_mono_logo.svg"
          alt="SyncChat Logo"
          onClick={() => navigate("/")}
          className="h-30 mb-1 cursor-pointer"
        />
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 pb-10 sm:p-6 md:p-10 lg:p-1 max-w-6xl w-full md:w-2/3 lg:w-full shadow-2xl flex flex-col md:flex-row gap-0 sm:gap-8 md:gap-12 items-center">
        {/* Mobile logo */}
        <div className="md:hidden w-full flex justify-center mb-3 sm:mb-4">
          <img
            src="/syncchat_full_logo.svg"
            alt="SyncChat Logo"
            onClick={() => navigate("/home")}
            className="h-13 sm:h-8"
          />
        </div>

        {/* Form section */}
        <div className="w-full lg:ml-25 md:w-[380px] md:flex-none bg-ghost/10 p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-md">
          <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6 md:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
              {userState === "Sign Up" ? "Create Account" : "Login"}
            </h2>
            <img
              src="/syncchat_icon.svg"
              alt="SyncChat Icon"
              className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7"
            />
          </div>

          <form onSubmit={onSubmitHandler}>
            {userState === "Sign Up" && (
              <div className="mb-3 sm:mb-4 md:mb-5">
                <label
                  htmlFor="name"
                  className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-gray-800"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-white text-xs sm:text-sm text-gray-800 placeholder-gray-400 outline-none"
                />
              </div>
            )}

            <div className="mb-3 sm:mb-4 md:mb-5">
              <label
                htmlFor="email"
                className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-gray-800"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-white text-xs sm:text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
            </div>

            <div className="mb-3 sm:mb-4 md:mb-5">
              <label
                htmlFor="password"
                className="block mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-gray-800"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg bg-white text-xs sm:text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              {userState === "Login" && (
                <div className="text-right mt-1.5 sm:mt-2">
                  <span
                    onClick={() => navigate("/reset-password")}
                    className="text-ghost text-[11px] sm:text-xs hover:text-purple-600 cursor-pointer"
                  >
                    Forgot Password?
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 sm:py-3 bg-ghost text-white rounded-lg text-sm sm:text-base font-medium mt-2 sm:mt-3 md:mt-3 hover:bg-purple-600 transition-colors"
            >
              {userState === "Sign Up" ? "Sign Up" : "Login"}
            </button>
          </form>

          <div className="text-center mt-3 sm:mt-4 md:mt-5 text-xs sm:text-sm text-gray-600">
            {userState === "Sign Up" ? (
              <>
                Already have an account?{" "}
                <span
                  onClick={() => setUserState("Login")}
                  className="text-ghost font-medium hover:text-purple-600 cursor-pointer"
                >
                  Login
                </span>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <span
                  onClick={() => setUserState("Sign Up")}
                  className="text-ghost font-medium hover:text-purple-600 cursor-pointer"
                >
                  Sign Up
                </span>
              </>
            )}
          </div>
        </div>

        {/* Illustration for desktop */}
        <div className="flex-1 flex-col items-center justify-center gap-5 hidden lg:flex">
          <img
            src="/login_bg_icon.svg"
            alt="Login Illustration"
            className="w-full max-w-xl"
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
