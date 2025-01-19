/* eslint-disable react-refresh/only-export-components */
// UnseenRepliesContext.js
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import config from "../config/config";
import PropTypes from "prop-types";

const UnseenRepliesContext = createContext();

export const fetchUnseenRepliesCountSender = async () => {
  const senderId = localStorage.getItem("userId");
  if (!senderId) return 0;
  try {
    const response = await axios.get(
      `${config.API}/count-not-seen-replies/${senderId}`
    );
    return response.data.notSeenCount;
  } catch (error) {
    console.error("Error fetching unseen replies count:", error);
    return 0;
  }
};

export const UnseenRepliesProviderSender = ({ children }) => {
  const [unseenRepliesCountSender, setUnseenRepliesCountSender] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const count = await fetchUnseenRepliesCountSender();
      setUnseenRepliesCountSender(count);
    };
    fetchCount();
  }, []);

  return (
    <UnseenRepliesContext.Provider
      value={{ unseenRepliesCountSender, setUnseenRepliesCountSender }}
    >
      {children}
    </UnseenRepliesContext.Provider>
  );
};

// Prop types validation
UnseenRepliesProviderSender.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useUnseenRepliesSender = () => {
  return useContext(UnseenRepliesContext);
};
