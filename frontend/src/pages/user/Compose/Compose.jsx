import { Box, Paper, Typography } from "@mui/material";
import FullForm from "./Forms/FullForm";
function Compose() {
  return (
    <Paper
      sx={{
        width: "100%",
        maxHeight: "calc(100vh - 10px)",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
        borderRadius: "4px",
        boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Fixed Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          backgroundColor: "#fff",
          borderBottom: "2px solid #ddd",
          textAlign: "center",
          mb: "15px",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: "#0A2841",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          Compose
        </Typography>
      </Box>

      {/* Scrollable Form Content */}
      <Box
        sx={{
          overflowY: "auto",
          padding: 2,
          flexGrow: 1,
        }}
      >
        <FullForm />
      </Box>
    </Paper>
  );
}

export default Compose;
