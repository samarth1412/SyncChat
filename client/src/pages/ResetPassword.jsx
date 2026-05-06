import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppContext from "../context/AppContext.jsx";
import axios from "axios";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);
  axios.defaults.withCredentials = true;

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [otp, setOtp] = useState(0);
  const [isOtpSubmitted, setIsOtpSubmitted] = useState(false);

  const inputRefs = React.useRef([]);

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeydown = (e, index) => {
    if (e.key === "Backspace" && e.target.value === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text");
    const pasteArray = paste.split("");
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
  };

  const onSubmitEmail = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        backendUrl + "/api/auth/send-reset-otp",
        { email }
      );
      data.success ? toast.success(data.message) : toast.error(data.message);
      data.success && setIsEmailSent(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onSubmitOtp = async (e) => {
    e.preventDefault();
    const otpArray = inputRefs.current.map((e) => e.value);
    setOtp(otpArray.join(""));
    setIsOtpSubmitted(true);
  };

  const onSubmitNewPassword = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        backendUrl + "/api/auth/reset-password",
        { email, otp, newPassword }
      );
      data.success ? toast.success(data.message) : toast.error(data.message);
      data.success && navigate("/login");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-ghost">
      <img
        onClick={() => navigate("/")}
        src="/syncchat_mono_logo.svg"
        alt="SyncChat Logo"
        className="absolute left-8 top-2 h-25 cursor-pointer"
      />

      {/* Step 1: Email Input */}
      {!isEmailSent && (
        <form
          onSubmit={onSubmitEmail}
          className="bg-gray-100 backdrop-blur-sm p-5 sm:p-10 m-3 text-center rounded-3xl shadow-3xl w-[250px] sm:w-[420px]"
        >
          <h1 className="text-gray-900 text-sm sm:text-2xl font-semibold text-center mb-3">
            Reset Password
          </h1>
          <p className="text-center mb-8 text-gray-500 text-xs sm:text-sm">
            Enter your registered email address
          </p>
          <input
            type="email"
            placeholder="Email id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full placeholder:text-gray-500 text-gray-600 px-4 py-2 sm:py-3 mb-6 rounded-xl border border-gray-200 focus:outline-none focus:border-[#9074DB] focus:ring-2 focus:ring-[#9074DB]/20 transition-all text-sm sm:text-base"
          />
          <button
            type="submit"
            className="w-2/3 text-center sm:w-full text-white text-sm sm:text-lg rounded-xl py-1.5 sm:py-3 bg-[#9074DB] hover:bg-[#7B5FCA] transition-colors duration-200 font-medium shadow-lg"
          >
            Submit
          </button>
        </form>
      )}

      {/* Step 2: OTP Verification */}
      {!isOtpSubmitted && isEmailSent && (
        <form
          onSubmit={onSubmitOtp}
          className="bg-gray-100 backdrop-blur-sm p-5 sm:p-10 m-3 text-center rounded-3xl shadow-3xl w-[250px] sm:w-[420px]"
        >
          <h1 className="text-gray-900 text-sm sm:text-2xl font-semibold text-center mb-3">
            Reset Password OTP
          </h1>
          <p className="text-center mb-8 text-[#9074DB] text-xs sm:text-sm">
            Enter the 6-digit code sent to your email id
          </p>
          <div
            className="flex justify-start gap-1 sm:gap-2 mb-6 sm:mb-8"
            onPaste={handlePaste}
          >
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <input
                  type="text"
                  key={index}
                  maxLength="1"
                  required
                  className="sm:w-12 sm:h-12 w-8 h-8 bg-[#ffffff] text-gray-900 text-center text-xl rounded-md"
                  ref={(el) => (inputRefs.current[index] = el)}
                  onInput={(e) => handleInput(e, index)}
                  onKeyDown={(e) => handleKeydown(e, index)}
                />
              ))}
          </div>
          <button
            type="submit"
            className="w-2/3 text-center sm:w-full text-white text-sm sm:text-lg rounded-xl py-1.5 sm:py-3 bg-[#9074DB] hover:bg-[#7B5FCA] transition-colors duration-200 font-medium shadow-lg"
          >
            Submit
          </button>
        </form>
      )}

      {/* Step 3: New Password */}
      {isOtpSubmitted && isEmailSent && (
        <form
          onSubmit={onSubmitNewPassword}
          className="bg-gray-100 backdrop-blur-sm p-5 sm:p-10 m-3 text-center rounded-3xl shadow-3xl w-[250px] sm:w-[420px]"
        >
          <h1 className="text-gray-900 text-sm sm:text-2xl font-semibold text-center mb-3">
            New Password
          </h1>
          <p className="text-center mb-8 text-gray-500 text-xs sm:text-sm">
            Enter the new password below
          </p>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-2 sm:py-3 mb-6 rounded-xl  border border-gray-200 focus:outline-none focus:border-[#9074DB] focus:ring-2 focus:ring-[#9074DB]/20 transition-all text-sm sm:text-base"
          />
          <button
            type="submit"
            className="w-2/3 text-center sm:w-full text-white text-sm sm:text-lg rounded-xl py-1.5 sm:py-3 bg-[#9074DB] hover:bg-[#7B5FCA] transition-colors duration-200 font-medium shadow-lg"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
