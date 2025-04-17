import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  useMediaQuery,
  useTheme,
  Grow,
} from "@mui/material";
import {
  CheckCircleOutline,
  ErrorOutline,
  WarningAmber,
  InfoOutlined,
  CloudDownload,
  Description,
  DataObject,
  Quiz,
  RocketLaunch,
  Timer,
  NetworkCheck,
  Computer,
} from "@mui/icons-material";

const TestInstructions = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { testName } = location.state || {};
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [showContent, setShowContent] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Color scheme
  const primaryColor = "#1976d2";
  const secondaryColor = "#0d47a1";
  const errorColor = "#d32f2f";
  const successColor = "#2e7d32";
  const warningColor = "#ffa000";
  const infoColor = "#0288d1";

  useEffect(() => {
    // Simulate initial loading sequence
    const steps = [
      {
        label: "Downloading resource files",
        duration: 1000,
        icon: <CloudDownload />,
        color: primaryColor,
      },
      {
        label: "Parsing resources files",
        duration: 1500,
        icon: <Description />,
        color: secondaryColor,
      },
      {
        label: "Initializing meta data",
        duration: 800,
        icon: <DataObject />,
        color: primaryColor,
      },
      {
        label: "Initializing questions",
        duration: 2000,
        icon: <Quiz />,
        color: secondaryColor,
      },
      {
        label: "Finalizing test setup",
        duration: 700,
        icon: <RocketLaunch />,
        color: errorColor,
      },
    ];

    let currentProgress = 0;
    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(step.label);
        currentProgress += 100 / steps.length;
        setProgress(currentProgress);

        if (index === steps.length - 1) {
          setTimeout(() => {
            setLoading(false);
            setTimeout(() => setShowContent(true), 300);
          }, 500);
        }
      }, steps.slice(0, index).reduce((acc, s) => acc + s.duration, 0));
    });
  }, []);

  const handleStartTest = () => {
    navigate("/loading-test-engine", { state: { testName } }); // Pass testName to LoadingTestEngine
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        background: "linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)",
        position: "relative",
        overflow: "hidden",
        overflowY: "hidden", // Prevent scrolling
      }}
    >
      {/* Loading Paper */}
      <Collapse in={loading} timeout={500} unmountOnExit>
        <Paper
          elevation={10}
          sx={{
            p: isMobile ? 2 : 4, // Adjust padding for small devices
            width: isMobile ? "90vw" : "100vw", // Adjust width for small devices
            maxWidth: isMobile ? 400 : 600, // Adjust maxWidth for small devices
            borderRadius: 3,
            background: "linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute", // Center the paper
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Box sx={{ mb: 4 }}>
            <Avatar
              sx={{
                bgcolor: "rgba(25, 118, 210, 0.1)",
                width: 80,
                height: 80,
                margin: "0 auto 20px",
                "& .MuiSvgIcon-root": {
                  fontSize: "2.5rem",
                  color: primaryColor,
                },
              }}
            >
              <RocketLaunch fontSize="inherit" />
            </Avatar>

            <Typography
              variant="h4"
              sx={{
                mb: 3,
                fontWeight: 700,
                color: secondaryColor,
                fontSize: isMobile ? "1.5rem" : "2rem",
              }}
            >
              Preparing Test Environment
            </Typography>
              {/* loading data */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                width: "100%",
                mb: 3,
                minHeight: 80,
                textAlign: "center", // Center horizontally
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "rgba(25, 118, 210, 0.1)",
                  color: primaryColor,
                }}
              >
                {currentStep.includes("Downloading") ? (
                  <CloudDownload />
                ) : currentStep.includes("Parsing") ? (
                  <Description />
                ) : currentStep.includes("Initializing") ? (
                  <DataObject />
                ) : (
                  <RocketLaunch />
                )}
              </Avatar>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#424242",
                  textAlign: "center", // Center text
                  flex: 1,
                }}
              >
                {currentStep}...
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 10,
                borderRadius: 5,
                mb: 2,
                background: "rgba(25, 118, 210, 0.1)",
                "& .MuiLinearProgress-bar": {
                  background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                  borderRadius: 5,
                },
              }}
            />

            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                color: "#616161",
                fontSize: "1rem",
              }}
            >
              {Math.round(progress)}% complete
            </Typography>
          </Box>
        </Paper>
      </Collapse>

      {/* Content Paper */}
      <Grow in={showContent} timeout={800}>
        <Paper
          elevation={10}
          sx={{
            p: isMobile ? 3 : 4,
            width: isMobile ? "90vw" : "80vw",
            maxWidth: 900,
            borderRadius: 3,
            background: "linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.2)",
            position: "relative",
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
            },
          }}
        >
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: secondaryColor,
                fontSize: isMobile ? "1.8rem" : "2.5rem",
                mb: 2,
              }}
            >
              {testName || "Test"}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#616161",
                fontSize: isMobile ? "1rem" : "1.1rem",
              }}
            >
              Please review the instructions carefully before starting
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 3,
              mb: 4,
            }}
          >
            {/* System Requirements */}
            <Paper
              elevation={3}
              sx={{
                flex: 1,
                p: 3,
                borderRadius: 2,
                borderLeft: `4px solid ${successColor}`,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: secondaryColor,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Computer fontSize="medium" /> System Requirements
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0, gap: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleOutline sx={{ color: successColor }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Stable internet connection (minimum 2Mbps)"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, gap: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleOutline sx={{ color: successColor }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Updated web browser (Chrome/Firefox/Edge)"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, gap: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleOutline sx={{ color: successColor }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Disable pop-up blockers"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              </List>
            </Paper>

            {/* Test Guidelines */}
            <Paper
              elevation={3}
              sx={{
                flex: 1,
                p: 3,
                borderRadius: 2,
                borderLeft: `4px solid ${warningColor}`,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  color: secondaryColor,
                  mb: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Timer fontSize="medium" /> Test Guidelines
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0, gap: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ErrorOutline sx={{ color: errorColor }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Don't refresh or close browser"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, gap: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <WarningAmber sx={{ color: warningColor }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Use full-screen mode"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, gap: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoOutlined sx={{ color: infoColor }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Auto-submit when timer ends"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
                <ListItem sx={{ px: 0, gap: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <NetworkCheck sx={{ color: "#7b1fa2" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Answers save automatically"
                    primaryTypographyProps={{ fontWeight: 500 }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>

          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              variant="contained"
              onClick={handleStartTest}
              size="large"
              startIcon={<RocketLaunch />}
              sx={{
                px: 6,
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderRadius: 50,
                background: `linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                boxShadow: "0 4px 15px rgba(25, 118, 210, 0.3)",
                "&:hover": {
                  boxShadow: "0 6px 20px rgba(25, 118, 210, 0.4)",
                },
              }}
            >
              Launch Test Now
            </Button>
          </Box>
        </Paper>
      </Grow>
    </Box>
  );
};

export default TestInstructions;