// useFetchReplies.js
import { useState, useCallback } from "react";
import axios from "axios";
import config from "../config/config";

const useFetchReplies = () => {
  const [replies, setReplies] = useState([]);
  const [unseenCounts, setUnseenCounts] = useState({});
  const userId = localStorage.getItem("userId");

  const fetchReplies = useCallback(
    async (documentId) => {
      try {
        const response = await axios.get(
          `${config.API}/get-replies-by-docx/${documentId}`
        );

        // Check if replies exist and is an array
        if (!Array.isArray(response.data)) {
          console.warn("Invalid response structure:", response.data);
          return;
        }

        // Include replies where the user is either the receiver or the sender
        const filteredReplies = response.data.filter(
          (reply) =>
            reply.receiver_id === Number(userId) ||
            reply.user_id === Number(userId)
        );

        const formattedReplies = filteredReplies.map((reply) => ({
          ...reply,
          date_of_reply: new Date(reply.date_of_reply).toLocaleDateString(),
          created_at: new Date(reply.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

        const unseenCount = formattedReplies.filter(
          (reply) => reply.seen === 0
        ).length;

        setReplies(formattedReplies);
        setUnseenCounts((prev) => ({ ...prev, [documentId]: unseenCount }));

      } catch {
        setReplies([]);
      }
    },
    [userId]
  );

  return { replies, unseenCounts, fetchReplies };
};

export default useFetchReplies;
