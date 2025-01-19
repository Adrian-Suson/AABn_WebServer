import { useCallback } from "react";
import axios from "axios";
import config from "../config/config";

const useTrackDocumentAction = () => {
  const trackDocumentAction = useCallback(
    async (documentCode, userId, action) => {
      try {
        await axios.post(`${config.API}/track-document-action`, {
          documentCode,
          userId,
          action,
        });
      } catch (error) {
        console.error("Error tracking document action:", error);
      }
    },
    []
  );

  return { trackDocumentAction };
};

export default useTrackDocumentAction;
