import { useState } from "react";
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
} from "@mui/material";
import axios from "axios";
import config from "../../../config/config";
import PropTypes from "prop-types"; // Add this import for PropTypes

const ReplyDialog = ({ open, onClose, reply, onReplySuccess }) => {
  const [replyText, setReplyText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReplyChange = (event) => {
    setReplyText(event.target.value);
  };

  const handleAttachmentChange = (event) => {
    setAttachment(event.target.files[0]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("reply_text", replyText);
    formData.append("document_id", reply.document_id);

    const senderId = reply.sender_id; // Receiver ID is the same as sender_id
    formData.append("receiver_id", senderId);

    const userId = localStorage.getItem("userId");
    formData.append("user_id", userId);

    if (attachment) {
      formData.append("file", attachment);
    }

    // Log the formData content
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    try {
      await axios.post(`${config.API}/submit-reply`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      onReplySuccess();
      onClose();
    } catch (error) {
      setError("Failed to send reply. Please try again.");
      console.error("Error sending reply:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reply to Document</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          autoFocus
          margin="dense"
          label="Your Reply"
          type="text"
          fullWidth
          variant="outlined"
          value={replyText}
          onChange={handleReplyChange}
        />
        <input type="file" onChange={handleAttachmentChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Send Reply"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// PropTypes for validation
ReplyDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  reply: PropTypes.shape({
    document_id: PropTypes.number.isRequired,
    sender_id: PropTypes.number.isRequired,
  }).isRequired,
  onReplySuccess: PropTypes.func.isRequired,
};

export default ReplyDialog;
