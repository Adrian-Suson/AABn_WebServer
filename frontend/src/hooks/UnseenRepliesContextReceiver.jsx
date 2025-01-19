/* eslint-disable react-refresh/only-export-components */
// UnseenRepliesContext.js
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import config from "../config/config";
import PropTypes from "prop-types";

const UnseenRepliesContext = createContext();

export const fetchUnseenRepliesCountReceiver = async () => {
  const senderId = localStorage.getItem("userId");
  if (!senderId) return 0;
  try {
    const response = await axios.get(
      `${config.API}/count-not-seen-replies/user/${senderId}`
    );
    return response.data.notSeenCount;
  } catch (error) {
    console.error("Error fetching unseen replies count:", error);
    return 0;
  }
};

export const UnseenRepliesProviderReceiver = ({ children }) => {
  const [unseenRepliesCountReceiver, setUnseenRepliesCountReceiver] =
    useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const count = await fetchUnseenRepliesCountReceiver();
      setUnseenRepliesCountReceiver(count);
    };
    fetchCount();
  }, []);

  return (
    <UnseenRepliesContext.Provider
      value={{ unseenRepliesCountReceiver, setUnseenRepliesCountReceiver }}
    >
      {children}
    </UnseenRepliesContext.Provider>
  );
};

// Prop types validation
UnseenRepliesProviderReceiver.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useUnseenRepliesReceiver = () => {
  return useContext(UnseenRepliesContext);
};
