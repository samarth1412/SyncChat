import React from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import AppContext from "../context/AppContext.jsx";
import axios from "axios";
import { toast } from "react-toastify";

const EmailVerify = () => {
  axios.defaults.withCredentials = true;
  const navigate = useNavigate();
  const { backendUrl, isLoggedIn, userData, getUserData } =
    useContext(AppContext);

  const inputRefs = React.useRef([]);

  const handleInput = (e, index) => {
    if (e.target.value > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && index > 0 && e.target.value === "") {
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

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      const otpArray = inputRefs.current.map((e) => e.value);
      const otp = otpArray.join("");

      const { data } = await axios.post(backendUrl + "/api/auth/verify-email", {
        otp,
      });
      if (data.success) {
        toast.success(data.message);
        getUserData();
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  React.useEffect(() => {
    getUserData();
  }, []);

  React.useEffect(() => {
    if (isLoggedIn && userData?.isAccountVerified) {
      navigate("/");
    }
  }, [isLoggedIn, userData, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-ghost">
      <img
        onClick={() => navigate("/")}
        src="/syncchat_mono_logo.svg"
        alt="SyncChat Logo"
        className="absolute top-2 left-1/2 transform -translate-x-1/2 h-30 cursor-pointer"
      />
      <form
        onSubmit={onSubmitHandler}
        className="bg-gray-100 backdrop-blur-sm p-5 sm:p-10 m-3 text-center rounded-3xl shadow-3xl w-[250px] sm:w-[420px]"
      >
        <h1 className="text-gray-900 text-sm sm:text-2xl font-semibold text-center mb-3">
          Verify Email OTP
        </h1>
        <p className="text-center mb-8 text-[#9074DB] text-xs sm:text-sm">
          Enter the 6-digit code sent to your email id to verify your email
        </p>

        <div
          className="flex justify-start gap-1 sm:gap-2 mb-6 sm:mb-8"
          onPaste={handlePaste}
        >
          {Array(6)
            .fill(0)
            .map((_, index) => {
              return (
                <input
                  type="text"
                  key={index}
                  maxLength="1"
                  required
                  className="sm:w-12 sm:h-12 w-8 h-8 bg-[#ffffff] text-ghost text-center text-xl rounded-md"
                  ref={(el) => (inputRefs.current[index] = el)} //assigning the each input box actual dom elemnent to empty array and store in inputRefs.current array
                  onInput={(e) => handleInput(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
              );
            })}
        </div>

        <button
          type="submit"
          className="w-2/3 text-center sm:w-full text-white text-sm sm:text-lg rounded-xl py-1.5 sm:py-3 bg-[#9074DB] hover:bg-[#7B5FCA] transition-colors duration-200 font-medium shadow-lg"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default EmailVerify;
