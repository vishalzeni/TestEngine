import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";

// Animations
const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
`;

const LoadingTestEngine = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { testName } = location.state || {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/test", { state: { testName } });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, testName]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #3f51b5 0%, #1a237e 100%)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Animated background shapes */}
      <Box
        sx={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          top: "-100px",
          left: "-100px",
          animation: `${float} 8s ease-in-out infinite`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.05)",
          bottom: "-50px",
          right: "-50px",
          animation: `${float} 10s ease-in-out infinite reverse`,
        }}
      />
      
      {/* Animated triangles */}
      <Box
        sx={{
          position: "absolute",
          width: "0",
          height: "0",
          borderLeft: "50px solid transparent",
          borderRight: "50px solid transparent",
          borderBottom: "100px solid rgba(255, 255, 255, 0.08)",
          top: "20%",
          right: "15%",
          animation: `${rotate} 15s linear infinite`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          width: "0",
          height: "0",
          borderLeft: "30px solid transparent",
          borderRight: "30px solid transparent",
          borderBottom: "60px solid rgba(255, 255, 255, 0.06)",
          bottom: "25%",
          left: "20%",
          animation: `${rotate} 20s linear infinite reverse`,
        }}
      />

      {/* Main content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1,
          animation: `${pulse} 2s ease-in-out infinite`,
        }}
      >
        {/* Animated loading spinner */}
        <Box
          sx={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "8px solid rgba(255, 255, 255, 0.3)",
            borderTopColor: "#fff",
            marginBottom: "24px",
            animation: `${rotate} 1.5s linear infinite`,
          }}
        />
        
        <Typography
          variant="h4"
          sx={{
            color: "white",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "8px",
            textShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
        >
          Loading Test Engine
        </Typography>
        
        <Typography
          variant="subtitle1"
          sx={{
            color: "rgba(255, 255, 255, 0.8)",
            textAlign: "center",
            maxWidth: "300px",
          }}
        >
          Preparing {testName || "your test"}...
        </Typography>
        
        {/* Progress dots */}
        <Box sx={{ display: "flex", marginTop: "24px", gap: "8px" }}>
          {[1, 2, 3].map((dot) => (
            <Box
              key={dot}
              sx={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "white",
                opacity: 0.3,
                animation: `${pulse} 1.5s ease-in-out infinite ${dot * 0.2}s`,
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LoadingTestEngine;