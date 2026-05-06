import React, { useState, useEffect } from "react";
import axios from "axios";
import AppContext from "../context/AppContext.jsx";

const AppContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthState = async () => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/auth/is-auth`,
        {},
        { withCredentials: true }
      );

      if (data.success) {
        setIsLoggedIn(true);
        localStorage.setItem("isLoggedIn", "true");
        await getUserData();
      } else {
        setIsLoggedIn(false);
        localStorage.removeItem("isLoggedIn");
      }
    } catch (error) {
      setIsLoggedIn(false);
      localStorage.removeItem("isLoggedIn");
      console.error(error);
    } finally {
      setLoading(false); // 3. Finish loading regardless of outcome
    }
  };

  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        withCredentials: true,
      });
      if (data.success) setUserData(data.userData);
    } catch (error) {
      console.error("Error fetching user data", error);
    }
  };

  useEffect(() => {
    getAuthState();
  }, []);

  return (
    <AppContext.Provider
      value={{
        backendUrl,
        isLoggedIn,
        setIsLoggedIn,
        userData,
        setUserData,
        getUserData,
        loading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
