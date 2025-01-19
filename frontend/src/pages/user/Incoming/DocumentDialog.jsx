import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Divider,
  IconButton,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import Fade from "@mui/material/Fade";
import ForwardDialog from "./ForwardDialog";

const DocumentDialog = ({
  open,
  handleClose,
  selectedDocument,
  replies,
  handleDownloadDocument,
  handleArchiveDocument,
  handleReplyDialogOpen,
}) => {
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Fade}
      maxWidth="md"
      fullWidth
    >
      <DialogContent>
        {selectedDocument && (
          <>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              p={1}
              sx={{ bgcolor: "#0A2841", color: "white", borderRadius: 1 }}
            >
              <Typography variant="h6">
                Status - {selectedDocument.recipient_status}
              </Typography>
              <Box sx={{ bgcolor: "#FFA000", p: 0.5, borderRadius: 1 }}>
                <Typography variant="body2">
                  {selectedDocument.recipient_status}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Sender Details
            </Typography>
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
              <Box>
                <Typography variant="body2">
                  <strong>Sender Name:</strong> {selectedDocument.sender_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Sender Email:</strong> {selectedDocument.sender_email}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Document Details
            </Typography>
            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
              <Box>
                <Typography variant="body2">
                  <strong>Document Code:</strong>{" "}
                  {selectedDocument.document_code}
                </Typography>
                <Typography variant="body2">
                  <strong>Subject:</strong> {selectedDocument.subject}
                </Typography>
                <Typography variant="body2">
                  <strong>Description:</strong> {selectedDocument.description}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2">
                  <strong>Prioritization:</strong>{" "}
                  {selectedDocument.prioritization}
                </Typography>
                <Typography variant="body2">
                  <strong>Classification:</strong>{" "}
                  {selectedDocument.classification}
                </Typography>
                <Typography variant="body2">
                  <strong>Date And Time:</strong>{" "}
                  {selectedDocument.date_of_letter},{" "}
                  <span style={{ fontSize: "0.8em" }}>
                    ({selectedDocument.created_at})
                  </span>
                </Typography>
                <Typography variant="body2">
                  <strong>Deadline:</strong>{" "}
                  {new Date(selectedDocument.deadline).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Attachments
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="body2">
                {selectedDocument.file_name}
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  sx={{
                    bgcolor: "#FFA000",
                    color: "black",
                    "&:hover": { bgcolor: "#FFB233" },
                  }}
                  onClick={() =>
                    handleDownloadDocument(selectedDocument.file_name)
                  }
                >
                  Download
                </Button>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Replies
            </Typography>
            {replies.length > 0 ? (
              replies.map((reply, index) => (
                <Box
                  key={index}
                  mb={2}
                  sx={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    p: 2,
                    backgroundColor: "#f9f9f9",
                    boxShadow: 2,
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                    {reply.sender_name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {reply.reply_text}
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography variant="body2" sx={{ color: "#333" }}>
                      {reply.file_name}
                    </Typography>
                    {reply.file_name && (
                      <IconButton
                        variant="contained"
                        size="small"
                        onClick={() => window.open(reply.fileUrl, "_blank")}
                        sx={{
                          ml: 2,
                          bgcolor: "#1976d2",
                          color: "white",
                          "&:hover": { bgcolor: "#115293" },
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: "gray" }}>
                    Date of Reply: {reply.date_of_reply} {reply.created_at}{" "}
                    <span
                      style={{
                        fontWeight: reply.seen ? "normal" : "bold",
                        color: reply.seen ? "green" : "red",
                      }}
                    >
                      {reply.seen ? " (Seen)" : " (Not Seen)"}
                    </span>
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body2" sx={{ color: "#888" }}>
                No replies available.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Box display="flex" justifyContent="space-between" width="100%">
          <Box display="flex" alignItems="center">
            {selectedDocument &&
              selectedDocument.recipient_status === "Received" && (
                <Button
                  variant="contained"
                  color="secondary"
                  sx={{ bgcolor: "#FFA000", mr: 2 }}
                  onClick={() => {
                    handleArchiveDocument(selectedDocument.document_code);
                    handleClose();
                  }}
                >
                  Archive
                </Button>
              )}
            <Button
              variant="contained"
              sx={{ bgcolor: "#0A2841", color: "white", mr: 2 }}
              onClick={handleReplyDialogOpen}
            >
              Reply
            </Button>

            {selectedDocument && (
              <ForwardDialog documentCode={selectedDocument.document_code} />
            )}
          </Box>

          <Button
            variant="contained"
            sx={{ bgcolor: "#0A2841", color: "white" }}
            onClick={handleClose}
          >
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

// PropTypes for DocumentDialog
DocumentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  selectedDocument: PropTypes.shape({
    recipient_status: PropTypes.string,
    sender_name: PropTypes.string,
    sender_email: PropTypes.string,
    document_code: PropTypes.string,
    subject: PropTypes.string,
    description: PropTypes.string,
    prioritization: PropTypes.string,
    classification: PropTypes.string,
    date_of_letter: PropTypes.string,
    created_at: PropTypes.string,
    deadline: PropTypes.string,
    file_name: PropTypes.string,
    document_id: PropTypes.number,
  }),
  replies: PropTypes.arrayOf(
    PropTypes.shape({
      sender_name: PropTypes.string,
      reply_text: PropTypes.string,
      file_name: PropTypes.string,
      fileUrl: PropTypes.string,
      date_of_reply: PropTypes.string,
      created_at: PropTypes.string,
      seen: PropTypes.number,
    })
  ).isRequired,
  handleDownloadDocument: PropTypes.func.isRequired,
  handleArchiveDocument: PropTypes.func.isRequired,
  handleReplyDialogOpen: PropTypes.func.isRequired,
};

export default DocumentDialog;
