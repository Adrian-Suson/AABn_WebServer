// src/theme.js

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0A2841", // Dark Blue
    },
    secondary: {
      main: "#FFA000", // Gold
    },
    background: {
      default: "#E0E0E0", // Light Gray
      paper: "#F5F5F5", // Light Grayish White (for cards, etc.)
    },
    text: {
      primary: "#000000", // White
      secondary: "#0A2841", // Dark Blue
    },
  },
  typography: {
    fontFamily: "'Source Sans Pro', sans-serif",
    h5: {
      fontWeight: 700, // Bold for h5
    },
    h6: {
      fontWeight: 600, // Semi-Bold for h6
    },
    button: {
      textTransform: "none", // Avoid uppercase for buttons
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px", // Rounded corners for buttons
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "#F5F5F5", // Background color for text fields
          borderRadius: "8px", // Rounded corners for input fields
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          padding: "16px",
        },
      },
    },
  },
});

export default theme;
