import { useState } from "react";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";
import { styled } from "@mui/system";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config/config";
import { rightLogo } from "../../assets/logoBase64";

const Logo = styled("img")({
  width: "200px",
  height: "200px",
  marginBottom: "20px",
  borderRadius: "50%",
  objectFit: "cover",
  padding: "10px",
});

const StyledPaper = styled(Paper)({
  padding: "40px 30px",
  borderRadius: "20px",
  backgroundColor: "#0A2841",
  textAlign: "center",
  maxWidth: "400px",
  width: "100%",
});

const StyledTextField = styled(TextField)({
  marginBottom: "20px",
  backgroundColor: "#FFFFFF",
  borderRadius: "8px",
  "& .MuiFilledInput-root": {
    borderRadius: "8px",
    color: "#000000",
  },
});

const StyledButton = styled(Button)({
  width: "100%",
  fontSize: "16px",
  fontWeight: "bold",
  borderRadius: "25px",
  padding: "10px",
  marginBottom: "15px",
  backgroundColor: "#FFA000",
  "&:hover": {
    backgroundColor: "#FFB233",
  },
});

const LoginAndRegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${config.API}/login`, {
        username,
        password,
      });

      if (response.data.success) {
        console.log("Login successful");
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.userId);
        localStorage.setItem("email", response.data.email);
        localStorage.setItem("role", response.data.role);
        navigate("/incoming");
        window.location.reload(false);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        setError("An error occurred during login. Please try again.");
      }
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#0A2841",
      }}
    >
      <StyledPaper elevation={0}>
        <Logo src={rightLogo} alt="Logo" />
        <Typography variant="h4" color="white" gutterBottom>
          AABn Web
        </Typography>
        <Box
          component="form"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
          noValidate
          autoComplete="off"
          onSubmit={handleLogin}
        >
          <StyledTextField
            label="Username"
            variant="filled"
            size="small"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <StyledTextField
            label="Password"
            variant="filled"
            type="password"
            size="small"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <Typography variant="body2" color="error" mb={2}>
              {error}
            </Typography>
          )}
          <StyledButton type="submit" variant="contained">
            Log In
          </StyledButton>
        </Box>
      </StyledPaper>
    </Box>
  );
};

export default LoginAndRegisterPage;
