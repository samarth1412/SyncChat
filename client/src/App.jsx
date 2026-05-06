import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Home from "./pages/Home";
import Login from "./pages/Login";
import EmailVerify from "./pages/EmailVerify";
import ResetPassword from "./pages/ResetPassword";
import CreateChatroom from "./pages/CreateChatroom";
import AppContext from "./context/AppContext";
import Chatroom from "./pages/Chatroom";

const App = () => {
  const ProtectedRoute = ({ children }) => {
    const { isLoggedIn, userData } = useContext(AppContext);

    if (!isLoggedIn) {
      toast.error("Please login first to create a room!");
      return <Navigate to="/login" replace />;
    }
    if (userData && !userData.isAccountVerified) {
      toast.error("Please verify your email to continue!");
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/email-verify" element={<EmailVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/create-chatroom"
          element={
            <ProtectedRoute>
              <CreateChatroom />
            </ProtectedRoute>
          }
        />
        <Route path="/room/:roomId" element={<Chatroom />} />
      </Routes>
    </div>
  );
};

export default App;
