import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Grid,
  Container,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  Badge,
  IconButton,
  Tooltip,
  Fade,
  TextField,
  Stack,
} from "@mui/material";
import { ErrorBoundary } from "react-error-boundary"; // Add error boundary
import {
  Timer,
  CheckCircle,
  Archive,
  History,
  Event,
  PlayCircle,
  Search,
  Refresh,
  School,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  intervalToDuration,
  formatDistanceToNow,
  format,
  differenceInSeconds,
} from "date-fns";
import { debounce } from "lodash";
import { styled } from "@mui/material/styles";

// Constants
const API_BASE_URL = "http://localhost:5000/api/tests";
const DEBOUNCE_DELAY = 300;
const TIME_UPDATE_INTERVAL = 10000; // Increased interval to 10 seconds

// Error Fallback Component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <Box role="alert" sx={{ textAlign: "center", p: 4 }}>
    <Typography variant="h6" color="error">
      Something went wrong:
    </Typography>
    <Typography variant="body1" color="text.secondary">
      {error.message}
    </Typography>
    <Button variant="contained" onClick={resetErrorBoundary}>
      Try Again
    </Button>
  </Box>
);

// Enhanced styled components with animations
const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  minHeight: "100vh",
  width: "100%",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const TestCard = styled(Card)(({ theme, status }) => ({
  height: "100%",
  maxWidth: "380px",
  minWidth: "380px",
  minHeight: "200px", // Added minimum height
  maxHeight: "400px", // Added maximum height
  display: "flex",
  flexDirection: "column",
  justifyContent: "center", // Center content vertically
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: theme.shadows[2],
  borderLeft: `5px solid ${
    status === "active"
      ? theme.palette.success.main
      : status === "upcoming"
      ? theme.palette.info.main
      : theme.palette.warning.main
  }`,
  background: theme.palette.background.paper,
  "&:hover": {
    transform: "translateY(-8px)",
    boxShadow: theme.shadows[8],
  },
  [theme.breakpoints.down("sm")]: {
    maxWidth: "100%",
    borderLeft: "none",
    borderTop: `5px solid ${
      status === "active"
        ? theme.palette.success.main
        : status === "upcoming"
        ? theme.palette.info.main
        : theme.palette.warning.main
    }`,
  },
}));

const StatusBadge = styled(Chip)(({ theme, status }) => ({
  position: "absolute",
  right: theme.spacing(1.5),
  fontWeight: 700,
  fontSize: "0.7rem",
  padding: theme.spacing(0.5),
  backgroundColor:
    status === "active"
      ? theme.palette.success.light + "aa"
      : status === "upcoming"
      ? theme.palette.info.light + "aa"
      : theme.palette.warning.light + "aa",
  color:
    status === "active"
      ? theme.palette.success.dark
      : status === "upcoming"
      ? theme.palette.info.dark
      : theme.palette.warning.dark,
  backdropFilter: "blur(4px)",
  border: `1px solid ${
    status === "active"
      ? theme.palette.success.main
      : status === "upcoming"
      ? theme.palette.info.main
      : theme.palette.warning.main
  }`,
}));

// Utility functions
const calculateTestProgress = (startDateTime, endDateTime) => {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  const totalDuration = end - start;
  if (totalDuration === 0) return 0; // Prevent division by zero
  const elapsed = now - start;

  if (now < start) {
    const preStartDuration =
      start - new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
    const preElapsed = now - (start.getTime() - 7 * 24 * 60 * 60 * 1000);
    return Math.min(100, Math.max(0, (preElapsed / preStartDuration) * 100));
  }
  if (now > end) return 100;

  return Math.min(100, (elapsed / totalDuration) * 100);
};

const formatTestData = (test) => ({
  ...test,
  startDateTime: new Date(test.startDateTime),
  endDateTime: new Date(test.endDateTime),
  sections: test.sections.map((section) => ({
    name: section.sectionName,
    duration: section.duration,
    questions: section.questions.length,
  })),
  description:
    test.description ||
    "The test will be automatically submitted when your allotted time expires.",
});

const AvailableTests = () => {
  const [tests, setTests] = useState([]);
  const [archivedTests, setArchivedTests] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [snackbarQueue, setSnackbarQueue] = useState([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Update current time every second for timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, TIME_UPDATE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // Enhanced snackbar handling
  useEffect(() => {
    if (snackbarQueue.length > 0 && !snackbar.open) {
      const [nextSnackbar, ...remainingQueue] = snackbarQueue;
      setSnackbar(nextSnackbar);
      setSnackbarQueue(remainingQueue);
    }
  }, [snackbarQueue, snackbar]);

  const enqueueSnackbar = (message, severity = "info") => {
    setSnackbarQueue((prevQueue) =>
      prevQueue.slice(-4).concat({ open: true, message, severity })
    ); // Limit queue size to 5
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchTests = useCallback(async (searchQuery = "") => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `${API_BASE_URL}?search=${encodeURIComponent(searchQuery)}`
        : API_BASE_URL;
      const response = await axios.get(url);

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid data format received");
      }

      return response.data.map(formatTestData);
    } catch (error) {
      console.error("Error fetching tests:", error);
      let message = "Failed to load tests. Please try again later.";

      if (error.response) {
        if (error.response.status === 404) {
          message = "No tests found matching your criteria.";
        } else if (error.response.status >= 500) {
          message = "Server error. Please try again later.";
        }
      } else if (error.request) {
        message = "Network error. Please check your connection.";
      }
      if (error.response?.status === 429) {
        message = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.status === 401) {
        message = "Unauthorized. Please log in to continue.";
      }
      enqueueSnackbar(message, "error");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllTests = useCallback(async () => {
    setTests(await fetchTests(debouncedQuery));
  }, [fetchTests, debouncedQuery]);

  useEffect(() => {
    loadAllTests(); // Simplify to always call loadAllTests
  }, [loadAllTests]);

  const handleRefresh = async () => {
    const fetchedTests = await fetchTests();
    setTests(fetchedTests);
    if (fetchedTests.length > 0) {
      enqueueSnackbar("Tests refreshed successfully!", "success");
    }
  };

  const formatTimeLeft = useCallback(
    (startDateTime, endDateTime) => {
      const now = currentTime;
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);

      if (now < start) {
        const diffInDays = Math.floor((start - now) / (1000 * 60 * 60 * 24));

        if (diffInDays > 3) {
          return {
            text: `Starts on ${format(start, "MMM d, yyyy h:mm a")}`,
            isHtml: false,
          };
        }

        const duration = intervalToDuration({ start: now, end: start });

        if (duration.days) {
          return {
            text: `Starts in ${duration.days}d ${duration.hours}h`,
            isHtml: false,
          };
        } else if (duration.hours || duration.minutes) {
          return {
            text: `Starts in ${duration.hours || 0}h ${duration.minutes || 0}m`,
            isHtml: false,
          };
        } else {
          const secondsLeft = differenceInSeconds(start, now);
          if (secondsLeft < 10) {
            return {
              text: `Starts in <span style="color: ${theme.palette.error.main}">${secondsLeft}s</span>`,
              isHtml: true,
            };
          } else {
            return {
              text: `Starts in ${Math.floor(secondsLeft / 60)}m ${
                secondsLeft % 60
              }s`,
              isHtml: false,
            };
          }
        }
      } else if (now >= start && now <= end) {
        const diffInDays = Math.floor((end - now) / (1000 * 60 * 60 * 24));

        if (diffInDays > 3) {
          return {
            text: `Ends on ${format(end, "MMM d, yyyy h:mm a")}`,
            isHtml: false,
          };
        }

        const duration = intervalToDuration({ start: now, end });

        if (duration.days) {
          return {
            text: `Ends in ${duration.days}d ${duration.hours}h`,
            isHtml: false,
          };
        } else if (duration.hours || duration.minutes) {
          return {
            text: `Ends in ${duration.hours || 0}h ${duration.minutes || 0}m`,
            isHtml: false,
          };
        } else {
          const secondsLeft = differenceInSeconds(end, now);
          if (secondsLeft < 10) {
            return {
              text: `Ends in <span style="color: ${theme.palette.error.main}">${secondsLeft}s</span>`,
              isHtml: true,
            };
          } else {
            return {
              text: `Ends in ${Math.floor(secondsLeft / 60)}m ${
                secondsLeft % 60
              }s`,
              isHtml: false,
            };
          }
        }
      } else {
        return {
          text: `Expired ${formatDistanceToNow(end)} ago`,
          isHtml: false,
        };
      }
    },
    [currentTime, theme]
  );

  const getTestStatus = useCallback(
    (startDateTime, endDateTime) => {
      const now = currentTime;
      const start = new Date(startDateTime);
      const end = new Date(endDateTime);

      if (now < start) return "upcoming";
      if (now >= start && now <= end) return "active";
      return "expired";
    },
    [currentTime]
  );

  // Modified to immediately archive expired tests
  useEffect(() => {
    const now = new Date();
    const [activeTests, upcomingTests, expiredTests] = tests.reduce(
      (acc, test) => {
        const start = new Date(test.startDateTime);
        const end = new Date(test.endDateTime);
        const status =
          now < start
            ? "upcoming"
            : now >= start && now <= end
            ? "active"
            : "expired";

        if (status === "active") acc[0].push(test);
        else if (status === "upcoming") acc[1].push(test);
        else acc[2].push(test);
        return acc;
      },
      [[], [], []]
    );

    if (expiredTests.length > 0) {
      setArchivedTests((prevArchived) => {
        const existingIds = new Set(prevArchived.map((t) => t._id));
        const newTests = expiredTests.filter((t) => !existingIds.has(t._id));
        return [...prevArchived, ...newTests];
      });
    }
  }, [tests]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const loadFilteredTests = async () => {
      const fetchedTests = await fetchTests(debouncedQuery);
      setTests(fetchedTests);
    };

    if (debouncedQuery) {
      loadFilteredTests();
    } else {
      loadAllTests();
    }
  }, [debouncedQuery, fetchTests, loadAllTests]);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case "active":
        return <PlayCircle color="success" fontSize="small" />;
      case "upcoming":
        return <Event color="info" fontSize="small" />;
      case "expired":
        return <History color="warning" fontSize="small" />;
      default:
        return <CheckCircle color="disabled" fontSize="small" />;
    }
  }, []);

  const handleStartTest = (test) => {
    navigate("/instructions", { state: { testName: test.name } });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const debouncedSetSearchQuery = useMemo(
    () =>
      debounce(
        (query, setSearchQuery) => setSearchQuery(query),
        DEBOUNCE_DELAY
      ),
    []
  );

  const handleSearchInputChange = (e) => {
    debouncedSetSearchQuery(e.target.value, setSearchQuery);
  };

  useEffect(() => {
    return () => {
      debouncedSetSearchQuery.cancel();
    };
  }, [debouncedSetSearchQuery]);

  const renderTestCards = (testsToRender, isArchive = false) => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress size={60} thickness={4} />
        </Box>
      );
    }

    if (testsToRender.length === 0) {
      const emptyStateMessages = {
        0: "No active tests at the moment.",
        1: "No upcoming tests. Check back later.",
        2: "No archived tests found.",
      };

      return (
        <Fade in={true}>
          <Box
            textAlign="center"
            py={6}
            sx={{
              background: theme.palette.background.paper,
              borderRadius: 2,
              boxShadow: theme.shadows[1],
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {debouncedQuery
                ? `No tests found for "${debouncedQuery}"`
                : emptyStateMessages[activeTab]}
            </Typography>
            <Typography variant="body2">
              {debouncedQuery
                ? "Try adjusting your search or check back later."
                : activeTab === 2
                ? ""
                : "Check back later for new tests."}
            </Typography>
          </Box>
        </Fade>
      );
    }

    return (
      <Grid container spacing={3} justifyContent="center">
        {testsToRender.map((test, index) => {
          const status = isArchive
            ? "expired"
            : getTestStatus(test.startDateTime, test.endDateTime);
          const timeLeft = formatTimeLeft(test.startDateTime, test.endDateTime);
          const progress = calculateTestProgress(
            test.startDateTime,
            test.endDateTime
          );

          return (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={4}
              key={test._id || `test-${index}-${Date.now()}`} // Updated key logic
            >
              <TestCard status={status}>
                <CardContent>
                  <Box position="relative">
                    <StatusBadge
                      status={status}
                      icon={getStatusIcon(status)}
                      label={status.toUpperCase()}
                    />
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {test.name}
                    </Typography>
                  </Box>

                  <Box my={1} display="flex" flexWrap="wrap" gap={1}>
                    {test.sections.map((section, idx) => (
                      <Chip
                        key={idx}
                        label={`${section.name} (${section.duration} min)`}
                        size="small"
                      />
                    ))}
                  </Box>

                  <Box width="100%" mb={2}>
                    {timeLeft.isHtml ? (
                      <Typography
                        variant="caption"
                        display="block"
                        gutterBottom
                        dangerouslySetInnerHTML={{ __html: timeLeft.text }}
                      />
                    ) : (
                      <Typography
                        variant="caption"
                        display="block"
                        gutterBottom
                      >
                        {timeLeft.text}
                      </Typography>
                    )}
                    {status !== "expired" && (
                      <Box
                        width="100%"
                        height={8}
                        bgcolor="divider"
                        borderRadius={3}
                        overflow="hidden"
                      >
                        <Box
                          width={`${progress}%`}
                          height="100%"
                          bgcolor={
                            status === "active"
                              ? theme.palette.success.main
                              : status === "upcoming"
                              ? theme.palette.info.main
                              : theme.palette.warning.main
                          }
                        />
                      </Box>
                    )}
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    color={
                      status === "active"
                        ? "success"
                        : status === "upcoming"
                        ? "info"
                        : "warning"
                    }
                    onClick={() => status === "active" && handleStartTest(test)}
                    startIcon={<Timer fontSize="small" />}
                    disabled={status !== "active"}
                  >
                    {status === "active"
                      ? "Start Test"
                      : status === "upcoming"
                      ? "Coming Soon"
                      : "Expired"}
                  </Button>
                </CardContent>
              </TestCard>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const categorizedTests = useMemo(() => {
    return tests.reduce(
      (acc, test) => {
        const status = getTestStatus(test.startDateTime, test.endDateTime);
        if (status === "active") acc.active.push(test);
        else if (status === "upcoming") acc.upcoming.push(test);
        return acc;
      },
      { active: [], upcoming: [] }
    );
  }, [tests, getTestStatus]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <StyledContainer maxWidth="xxl">
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Box mb={4} textAlign="center" px={2}>
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            flexWrap="wrap"
          >
            <School
              sx={{
                fontSize: isMobile ? "2rem" : "2.5rem",
                color: theme.palette.primary.main,
              }}
            />
            <Typography
              variant={isMobile ? "h4" : "h3"}
              fontWeight={800}
              gutterBottom
              sx={{
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
              }}
            >
              Test Engine
            </Typography>
          </Stack>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: "600px",
              mx: "auto",
              mt: 1,
              fontSize: isMobile ? "0.9rem" : "1rem",
            }}
          >
            Manage your tests below. Start active tests, view upcoming tests, or
            check archived results.
          </Typography>
        </Box>

        <Paper
          elevation={2}
          sx={{
            mb: 4,
            borderRadius: isMobile ? 0 : 2,
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            maxWidth: "1200px",
            margin: "0 auto",
            position: "sticky",
            padding: isMobile ? theme.spacing(1) : theme.spacing(1),
            top: theme.spacing(8),
            zIndex: theme.zIndex.appBar,
            boxShadow: isMobile ? theme.shadows[1] : theme.shadows[3],
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                "& .MuiTabs-indicator": {
                  height: 4,
                  borderRadius: 2,
                },
                flex: 1,
                minWidth: 0,
              }}
            >
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <PlayCircle color="success" fontSize="small" />
                    Active
                    {categorizedTests.active.length > 0 && (
                      <Badge
                        badgeContent={categorizedTests.active.length}
                        color="success"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                }
                sx={{ fontWeight: 600, textTransform: "none" }}
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Event color="info" fontSize="small" />
                    Upcoming
                    {categorizedTests.upcoming.length > 0 && (
                      <Badge
                        badgeContent={categorizedTests.upcoming.length}
                        color="info"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                }
                sx={{ fontWeight: 600, textTransform: "none" }}
              />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Archive color="warning" fontSize="small" />
                    Archives
                    {archivedTests.length > 0 && (
                      <Badge
                        badgeContent={archivedTests.length}
                        color="warning"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                }
                sx={{ fontWeight: 600, textTransform: "none" }}
              />
            </Tabs>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <TextField
                placeholder="Search tests..."
                onChange={handleSearchInputChange}
                InputProps={{
                  startAdornment: (
                    <Search color="action" fontSize="small" sx={{ mr: 1 }} />
                  ),
                }}
                sx={{
                  minWidth: 200,
                  "& .MuiInputBase-root": {
                    height: 40,
                  },
                }}
              />

              <Tooltip title="Refresh tests">
                <IconButton onClick={handleRefresh} size="small">
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        <Box mb={4} />

        {activeTab === 0 && renderTestCards(categorizedTests.active)}
        {activeTab === 1 && renderTestCards(categorizedTests.upcoming)}
        {activeTab === 2 && renderTestCards(archivedTests, true)}
      </StyledContainer>
    </ErrorBoundary>
  );
};

export default AvailableTests;
