import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
  CircularProgress,
  AppBar,
  Toolbar,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogContent,
} from "@mui/material";
import {
  ArrowBack,
  ArrowForward,
  Flag,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Timer,
  Calculate,
} from "@mui/icons-material";
import ProgressPanel from "../Students/ProgressPanel";
import SubmitDialog from "../components/SubmitDialog";
import Calculator from "../components/Calculator"; // Import Calculator component

// Constants for better maintainability
const SECTION_COLORS = ["#3f51b5", "#009688", "#ff5722"];
const STATUS_COLORS = {
  current: "#2196f3",
  answered: "#4caf50",
  saved: "#ff9800",
  flagged: "#9c27b0",
  notViewed: "#ffffff",
  visited: "#bdbdbd",
  unanswered: "#ff9800",
};

const INITIAL_LOADING_DELAY = 3000;
const TIMER_INTERVAL = 1000;

const TestPage = () => {
  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // State management
  const [test, setTest] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [progress, setProgress] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [sectionTimes, setSectionTimes] = useState({});
  const [currentSectionTimeLeft, setCurrentSectionTimeLeft] = useState(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Sidebar closed by default on mobile
  const [showSubmitButton, setShowSubmitButton] = useState(false); // State to toggle submit button
  const [timeUpDialogOpen, setTimeUpDialogOpen] = useState(false);
  const [timeUpCountdown, setTimeUpCountdown] = useState(5);
  const [calculatorOpen, setCalculatorOpen] = useState(false); // State to manage calculator dialog
  const [loading, setLoading] = useState(true); // Add loading state
  const [calculatorEnabled, setCalculatorEnabled] = useState(false);

  // Memoized values
  const currentSection = useMemo(
    () => test?.sections[currentSectionIndex],
    [test, currentSectionIndex]
  );

  const currentQuestion = useMemo(
    () => currentSection?.questions?.[currentQuestionIndex] || null,
    [currentSection, currentQuestionIndex]
  );

  const currentQuestionId = useMemo(
    () => currentQuestion?.id,
    [currentQuestion]
  );

  const totalQuestionsAllSections = useMemo(
    () =>
      test?.sections.reduce(
        (sum, section) => sum + (section.questions?.length || 0),
        0
      ) || 0,
    [test]
  );

  const answeredQuestionsAllSections = useMemo(
    () => Object.values(answers).filter((a) => a).length,
    [answers]
  );

  const flaggedQuestionsAllSections = useMemo(
    () => Object.values(flaggedQuestions).filter((f) => f).length,
    [flaggedQuestions]
  );

  const unansweredQuestionsAllSections = useMemo(
    () => totalQuestionsAllSections - answeredQuestionsAllSections,
    [totalQuestionsAllSections, answeredQuestionsAllSections]
  );

  // Initialize section times when test data is loaded
  useEffect(() => {
    const { testName } = location.state || {}; // Retrieve testName from state
    if (!testName) return;

    const fetchTest = async () => {
      try {
        setLoading(true); // Set loading to true
        const encodedTestName = encodeURIComponent(testName);
        const response = await fetch(
          `http://localhost:5000/api/tests/${encodedTestName}`
        );
        if (!response.ok) throw new Error("Failed to fetch test");
        const foundTest = await response.json();
        if (foundTest) {
          setTest(foundTest);
          setCalculatorEnabled(foundTest.calculatorEnabled || false); // Set calculatorEnabled
          initializeProgress(foundTest);
          setActiveSection(foundTest.sections[0]?.sectionName || null);

          // Calculate section times
          const sectionTimes = {};
          foundTest.sections.forEach((section) => {
            sectionTimes[section.sectionName] = parseInt(section.duration) * 60; // Use section-specific duration
          });
          setSectionTimes(sectionTimes);
          setCurrentSectionTimeLeft(
            sectionTimes[foundTest.sections[0].sectionName]
          );
        }
      } catch (error) {
        console.error("Error fetching test:", error);
      } finally {
        setLoading(false); // Set loading to false
      }
    };

    fetchTest();
  }, [location]);

  // Timer effect for current section
  useEffect(() => {
    if (currentSectionTimeLeft === null) return;

    const timer = setInterval(() => {
      setCurrentSectionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSectionTimeEnd();
          return 0;
        }
        return prev - 1;
      });
    }, TIMER_INTERVAL);

    return () => clearInterval(timer);
  }, [currentSectionTimeLeft]);

  const handleSectionTimeEnd = useCallback(() => {
    if (!test) return;

    // Move to next section if available
    const nextSectionIndex = currentSectionIndex + 1;
    if (nextSectionIndex < test.sections.length) {
      setCurrentSectionIndex(nextSectionIndex);
      setCurrentQuestionIndex(0);
      const nextSection = test.sections[nextSectionIndex];
      setActiveSection(nextSection.sectionName);
      setCurrentSectionTimeLeft(sectionTimes[nextSection.sectionName]);
    } else {
      // Last section - show time up dialog
      setTimeUpDialogOpen(true);
      const countdown = setInterval(() => {
        setTimeUpCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [test, currentSectionIndex, sectionTimes]);

  const handleAutoSubmit = useCallback(() => {
    setTimeUpDialogOpen(false);
    navigate("/result", {
      state: {
        test,
        answers,
        progress,
        autoSubmitted: true, // Indicate that the test was auto-submitted
        attempted: Object.values(progress).reduce(
          (sum, section) => sum + section.filter((q) => q).length,
          0
        ),
        total: totalQuestionsAllSections,
      },
    });
  }, [navigate, test, answers, progress, totalQuestionsAllSections]);

  // Update current section time when section changes
  useEffect(() => {
    if (activeSection && sectionTimes[activeSection]) {
      setCurrentSectionTimeLeft(sectionTimes[activeSection]);
    }
  }, [activeSection, sectionTimes]);

  // Helper functions
  const initializeProgress = useCallback((testData) => {
    const initialProgress = {};
    const initialAnswers = {};
    const initialFlagged = {};
    const initialVisited = {};

    testData.sections.forEach((section) => {
      const questions = section.questions || [];
      initialProgress[section.sectionName] = Array(questions.length).fill(
        false
      );

      questions.forEach((question) => {
        initialAnswers[question.id] = "";
        initialFlagged[question.id] = false;
        initialVisited[question.id] = false;
      });
    });

    setProgress(initialProgress);
    setAnswers(initialAnswers);
    setFlaggedQuestions(initialFlagged);
    setVisitedQuestions(initialVisited);
  }, []);

  const handleOptionChange = useCallback((questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === option ? "" : option,
    }));
  }, []);

  const markQuestionVisited = useCallback((questionId) => {
    setVisitedQuestions((prev) => ({ ...prev, [questionId]: true }));
  }, []);

  const saveCurrentQuestion = useCallback(() => {
    if (!test || !currentSection) return;

    const questionId = currentQuestionId;
    if (!questionId) return;

    const updatedProgress = { ...progress };
    updatedProgress[currentSection.sectionName][currentQuestionIndex] = true;
    setProgress(updatedProgress);

    markQuestionVisited(questionId);
    setSnackbarOpen(true);
    return questionId;
  }, [
    test,
    currentSection,
    currentQuestionIndex,
    progress,
    currentQuestionId,
    markQuestionVisited,
  ]);

  const moveToNextQuestion = useCallback(() => {
    if (!test) return;

    markQuestionVisited(currentQuestionId);

    const isLastQuestionInSection =
      currentQuestionIndex === currentSection.questions.length - 1;
    const isLastSection = currentSectionIndex === test.sections.length - 1;

    if (isLastQuestionInSection && !isLastSection) {
      setCurrentSectionIndex((prev) => prev + 1);
      setCurrentQuestionIndex(0);
      setActiveSection(test.sections[currentSectionIndex + 1].sectionName);
    } else if (!isLastQuestionInSection) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [
    test,
    currentSectionIndex,
    currentQuestionIndex,
    currentSection,
    currentQuestionId,
    markQuestionVisited,
  ]);

  const handleSaveAndNext = useCallback(() => {
    saveCurrentQuestion();
    moveToNextQuestion();
  }, [saveCurrentQuestion, moveToNextQuestion]);

  const handleNormalNext = useCallback(() => {
    if (!currentQuestionId) return;

    if (
      answers[currentQuestionId] &&
      !progress[activeSection]?.[currentQuestionIndex]
    ) {
      alert("Please save your answer before proceeding or use Save & Next");
      return;
    }
    moveToNextQuestion();
  }, [
    answers,
    activeSection,
    currentQuestionIndex,
    progress,
    moveToNextQuestion,
    currentQuestionId,
  ]);

  const handlePreviousQuestion = useCallback(() => {
    if (!test) return;

    markQuestionVisited(currentQuestionId);

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else if (currentSectionIndex > 0) {
      const prevSection = test.sections[currentSectionIndex - 1];
      setCurrentSectionIndex((prev) => prev - 1);
      setCurrentQuestionIndex(prevSection.questions.length - 1);
      setActiveSection(prevSection.sectionName);
    }
  }, [
    test,
    currentSectionIndex,
    currentQuestionIndex,
    currentQuestionId,
    markQuestionVisited,
  ]);

  const handleSectionClick = useCallback(
    (sectionIndex) => {
      if (!test) return;

      setCurrentSectionIndex(sectionIndex);
      setCurrentQuestionIndex(0);
      setActiveSection(test.sections[sectionIndex].sectionName);
    },
    [test]
  );

  const handleQuestionClick = useCallback((questionIndex) => {
    setCurrentQuestionIndex(questionIndex);
  }, []);

  const handleFlagQuestion = useCallback(() => {
    if (!currentQuestionId) return;

    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestionId]: !prev[currentQuestionId],
    }));
    saveCurrentQuestion();
  }, [currentQuestionId, saveCurrentQuestion]);

  const handleSubmitTest = useCallback(() => {
    setSubmitDialogOpen(true);
  }, []);

  const confirmSubmit = useCallback(() => {
    setSubmitDialogOpen(false);
    navigate("/result", {
      state: {
        test,
        answers,
        progress,
        autoSubmitted: false, // Indicate manual submission
        attempted: Object.values(progress).reduce(
          (sum, section) => sum + section.filter((q) => q).length,
          0
        ),
        total: totalQuestionsAllSections,
      },
    });
  }, [navigate, test, answers, progress, totalQuestionsAllSections]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const handleSaveOnLastQuestion = useCallback(() => {
    saveCurrentQuestion();
    setShowSubmitButton(true); // Show the submit button after saving
  }, [saveCurrentQuestion]);

  const handleSubmitTestDirectly = useCallback(() => {
    setSubmitDialogOpen(true); // Open submit dialog on submit button click
  }, []);

  const getQuestionStatus = useCallback(
    (questionId, questionIndex) => {
      const isCurrent = currentQuestionIndex === questionIndex;
      const isFlagged = flaggedQuestions[questionId];
      const hasAnswer = answers[questionId];
      const isSaved = progress[activeSection]?.[questionIndex];
      const isVisited = visitedQuestions[questionId];

      if (isCurrent) return "current";
      if (isFlagged) return "flagged";
      if (isSaved && hasAnswer) return "answered";
      if (isSaved && !hasAnswer) return "saved";
      if (isVisited && !isSaved) return "visited";
      if (!isVisited) return "notViewed";
      return "unanswered";
    },
    [
      activeSection,
      currentQuestionIndex,
      flaggedQuestions,
      progress,
      answers,
      visitedQuestions,
    ]
  );

  const formatTime = useCallback((seconds) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleCalculatorOpen = () => setCalculatorOpen(true);
  const handleCalculatorClose = () => setCalculatorOpen(false);

  const fetchResults = async () => {
    return { test, answers, progress }; // Pass the test, answers, and progress data
  };

  // Render functions
  const renderNoTestData = () => (
    <Box
      sx={{
        p: 4,
        textAlign: "center",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        color: "#000",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 500 }}>
        No test data available. Please go back and select a test.
      </Typography>
    </Box>
  );

  const renderNoQuestions = () => (
    <Box
      sx={{
        p: 4,
        textAlign: "center",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f87171 0%, #fecaca 100%)",
        color: "#fff",
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 500 }}>
        No questions available for this section. Please go back and select a
        different test.
      </Typography>
    </Box>
  );

  // Conditional renders
  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        }}
      >
        <CircularProgress size={50} />
      </Box>
    );
  }

  if (!test) return renderNoTestData();
  if (!currentQuestion) return renderNoQuestions();

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: "#f9fafb",
      }}
    >
      {/* Main Header */}
      <AppBar
        position="static"
        sx={{
          background: "linear-gradient(90deg, #3f51b5 0%, #5c6bc0 100%)",
          boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
          borderBottom: "1px solid #e0e0e0",
          height: { xs: 48, sm: 56 },
          minHeight: "unset", // Prevent MUI default override
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            minHeight: "unset", // Override default MUI 64px min height
            height: { xs: 48, sm: 56 },
            px: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              color: "white",
              fontSize: { xs: "1rem", sm: "1.25rem" },
              maxWidth: { xs: 150, sm: 300 },
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {test.name}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Timer sx={{ fontSize: 20, color: "white" }} />
            <Typography
              variant="subtitle2"
              sx={{
                color: "white",
                fontWeight: 500,
                fontSize: { xs: "0.8125rem", sm: "1rem" },
              }}
            >
              {formatTime(currentSectionTimeLeft)} /{" "}
              {formatTime(sectionTimes[activeSection] || 0)}
            </Typography>
            {calculatorEnabled && ( // Conditionally render calculator icon
              <Tooltip title="Open Calculator">
                <IconButton
                  onClick={handleCalculatorOpen}
                  sx={{
                    marginLeft: "auto",
                    color: "#ffffff",
                    "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                  }}
                >
                  <Calculate />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sections Header */}
      <Box
        sx={{
          backgroundColor: "#e3f2fd",
          borderBottom: "1px solid #e0e0e0",
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
          overflowX: "auto",
          whiteSpace: "nowrap",
          boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.08)",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            color: "#424242",
            fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          }}
        >
          Section:
        </Typography>

        {test.sections.map((section, index) => (
          <Chip
            key={index}
            label={section.sectionName}
            variant={
              activeSection === section.sectionName ? "filled" : "outlined"
            }
            sx={{
              backgroundColor:
                activeSection === section.sectionName
                  ? SECTION_COLORS[index % SECTION_COLORS.length]
                  : "transparent",
              color:
                activeSection === section.sectionName ? "white" : "#424242",
              borderColor:
                activeSection === section.sectionName
                  ? SECTION_COLORS[index % SECTION_COLORS.length]
                  : "#bdbdbd",
              cursor: "pointer",
              fontSize: { xs: "0.7rem", sm: "0.8125rem" },
              height: { xs: 26, sm: 30 },
              px: 1.5,
              "&:hover": {
                backgroundColor:
                  activeSection === section.sectionName
                    ? SECTION_COLORS[index % SECTION_COLORS.length]
                    : "rgba(117, 117, 117, 0.1)",
              },
            }}
          />
        ))}

      </Box>

      {/* Calculator Dialog */}
      <Dialog
        open={calculatorOpen}
        onClose={handleCalculatorClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: { borderRadius: 3, overflow: "hidden" },
        }}
      >
        <DialogContent>
          <Calculator open={calculatorOpen} onClose={handleCalculatorClose} />{" "}
          {/* Pass props */}
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          transition: "all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)", // Smoother animation for sidebar
        }}
      >
        {/* Question Panel */}
        <Box
          sx={{
            width: sidebarOpen ? { xs: "100%", md: "80%" } : "100%", // Adjust width with animation
            p: { xs: 2, md: 3 },
            backgroundColor: "#f5f5f5",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            transition: "all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)", // Smoother animation for width
          }}
        >
          {/* Sidebar Toggle Icon */}
          <Box
            onClick={toggleSidebar}
            sx={{
              position: "absolute",
              top: "50%",
              right: -10,
              transform: "translateY(-50%)",
              width: 30,
              height: 100,
              background: "#3f51b5",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "left",
              cursor: "pointer",
              borderRadius: 2,
              transition: "all 0.3s ease-in-out", // Smooth animation for hover
              "&:hover": {
                backgroundColor: "#333",
              },
            }}
          >
            {sidebarOpen ? (
              <ChevronRight
                sx={{ color: "white", fontSize: 24, paddingRight: "10px" }}
              />
            ) : (
              <ChevronLeft
                sx={{ color: "white", fontSize: 24, paddingRight: "10px" }}
              />
            )}
          </Box>

          <Box
            sx={{
              overflowY: "auto",
              flex: 1,
              "&::-webkit-scrollbar": { display: "none" },
              "&:hover::-webkit-scrollbar": { display: "block" },
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#bdbdbd",
                borderRadius: 4,
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#9e9e9e",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
                pb: 1.5,
                borderBottom: "1px solid #e0e0e0",
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color:
                      SECTION_COLORS[
                        currentSectionIndex % SECTION_COLORS.length
                      ],
                    mb: 0.5,
                    fontSize: { xs: "1.1rem", sm: "1.25rem" },
                  }}
                >
                  {currentSection.sectionName}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#616161",
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  Question {currentQuestionIndex + 1} of{" "}
                  {currentSection.questions.length}
                </Typography>
              </Box>
              <Tooltip
                title={
                  flaggedQuestions[currentQuestionId]
                    ? "Unflag question"
                    : "Flag question"
                }
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      fontSize: "0.875rem",
                      bgcolor: "#424242",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                  }}
                  onClick={handleFlagQuestion}
                >
                  <IconButton
                    sx={{
                      color: flaggedQuestions[currentQuestionId]
                        ? STATUS_COLORS.flagged
                        : "#9e9e9e",
                      backgroundColor: flaggedQuestions[currentQuestionId]
                        ? "rgba(156, 39, 176, 0.1)"
                        : "transparent",
                      "&:hover": {
                        backgroundColor: "rgba(156, 39, 176, 0.2)",
                      },
                      p: { xs: 0.5, sm: 1 },
                    }}
                  >
                    <Flag fontSize={isMobile ? "small" : "medium"} />
                  </IconButton>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      color: flaggedQuestions[currentQuestionId]
                        ? STATUS_COLORS.flagged
                        : "#616161",
                    }}
                  >
                    {flaggedQuestions[currentQuestionId] ? "Flagged" : "Flag"}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>

            <Box
              sx={{
                backgroundColor: "white",
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                mb: 2,
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)", // Drop shadow
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  lineHeight: 1.6,
                  fontWeight: 600,
                }}
              >
                Q{currentQuestionIndex + 1}. {currentQuestion.question}
              </Typography>

              <RadioGroup
                value={answers[currentQuestionId] || ""}
                onChange={(e) =>
                  handleOptionChange(currentQuestionId, e.target.value)
                }
              >
                {currentQuestion.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option.text}
                    control={
                      <Radio
                        color="primary"
                        size={isMobile ? "small" : "medium"}
                      />
                    }
                    label={option.text}
                    sx={{
                      mb: 0.5,
                      p: { xs: 0.8, sm: 1.2 },
                      borderRadius: 1,
                      backgroundColor:
                        answers[currentQuestionId] === option.text
                          ? "#e3f2fd"
                          : "transparent",
                      border:
                        answers[currentQuestionId] === option.text
                          ? "1px solid #90caf9"
                          : "1px solid transparent",
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                        border: "1px solid #e0e0e0",
                      },
                      transition: "all 0.2s ease",
                      "& .MuiFormControlLabel-label": {
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                      },
                    }}
                  />
                ))}
              </RadioGroup>
            </Box>
          </Box>

          {/* Navigation Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: 2,
              pt: 1.5,
              borderTop: "1px solid #e0e0e0",
            }}
          >
            {/* Previous Button */}
            <Tooltip
              title="Go to previous question"
              placement="top"
              componentsProps={{
                tooltip: {
                  sx: {
                    fontSize: "0.875rem",
                    bgcolor: "#424242",
                  },
                },
              }}
            >
              <span>
                <Button
                  variant="outlined"
                  onClick={handlePreviousQuestion}
                  disabled={
                    currentQuestionIndex === 0 && currentSectionIndex === 0
                  }
                  startIcon={
                    <ArrowBack fontSize={isMobile ? "small" : "medium"} />
                  }
                  sx={{
                    color: "#1976d2",
                    borderColor: "#1976d2",
                    "&:hover": {
                      borderColor: "#1565c0",
                      backgroundColor: "rgba(25, 118, 210, 0.04)",
                    },
                    "&:disabled": {
                      color: "#bdbdbd",
                      borderColor: "#e0e0e0",
                    },
                    py: { xs: 0.5, sm: 0.75 },
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  Previous
                </Button>
              </span>
            </Tooltip>

            {/* Conditional Buttons */}
            <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 } }}>
              {/* Show "Next" button only if not on the last question of the last section */}
              {!(
                currentSectionIndex === test.sections.length - 1 &&
                currentQuestionIndex === currentSection.questions.length - 1
              ) && (
                <Tooltip
                  title="Move to next question without saving"
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        fontSize: "0.875rem",
                        bgcolor: "#424242",
                      },
                    },
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={handleNormalNext}
                    sx={{
                      backgroundColor: "#e3f2fd",
                      color: "#1565c0",
                      "&:hover": {
                        backgroundColor: "#bbdefb",
                      },
                      py: { xs: 0.5, sm: 0.75 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                    endIcon={
                      <ArrowForward fontSize={isMobile ? "small" : "medium"} />
                    }
                  >
                    Next
                  </Button>
                </Tooltip>
              )}

              {/* Show "Save" or "Submit Test" button on the last question of the last section */}
              {currentSectionIndex === test.sections.length - 1 &&
                currentQuestionIndex === currentSection.questions.length - 1 &&
                (showSubmitButton ? (
                  <Tooltip
                    title="Submit your test"
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          fontSize: "0.875rem",
                          bgcolor: "#424242",
                        },
                      },
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleSubmitTestDirectly}
                      sx={{
                        backgroundColor: "#4caf50",
                        color: "#fff",
                        "&:hover": {
                          backgroundColor: "#388e3c",
                        },
                        py: { xs: 0.5, sm: 0.75 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                      startIcon={
                        <CheckCircle fontSize={isMobile ? "small" : "medium"} />
                      }
                    >
                      Submit Test
                    </Button>
                  </Tooltip>
                ) : (
                  <Tooltip
                    title="Save your answer"
                    placement="top"
                    componentsProps={{
                      tooltip: {
                        sx: {
                          fontSize: "0.875rem",
                          bgcolor: "#424242",
                        },
                      },
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleSaveOnLastQuestion}
                      sx={{
                        backgroundColor: "#1976d2",
                        color: "#fff",
                        "&:hover": {
                          backgroundColor: "#1565c0",
                        },
                        py: { xs: 0.5, sm: 0.75 },
                        fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      }}
                    >
                      Save
                    </Button>
                  </Tooltip>
                ))}

              {/* Show "Save & Next" button for other questions */}
              {!(
                currentSectionIndex === test.sections.length - 1 &&
                currentQuestionIndex === currentSection.questions.length - 1
              ) && (
                <Tooltip
                  title="Save answer and move to next question"
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        fontSize: "0.875rem",
                        bgcolor: "#424242",
                      },
                    },
                  }}
                >
                  <Button
                    variant="contained"
                    onClick={handleSaveAndNext}
                    sx={{
                      backgroundColor: "#1976d2",
                      color: "#fff",
                      "&:hover": {
                        backgroundColor: "#1565c0",
                      },
                      py: { xs: 0.5, sm: 0.75 },
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    }}
                    endIcon={
                      <ArrowForward fontSize={isMobile ? "small" : "medium"} />
                    }
                  >
                    Save & Next
                  </Button>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Box>

        {/* Progress Panel */}
        {sidebarOpen && (
          <ProgressPanel
            test={test}
            currentSectionIndex={currentSectionIndex}
            currentQuestionIndex={currentQuestionIndex}
            activeSection={activeSection}
            answers={answers}
            progress={progress}
            flaggedQuestions={flaggedQuestions}
            answeredQuestions={answeredQuestionsAllSections}
            totalQuestions={totalQuestionsAllSections}
            handleSectionClick={handleSectionClick}
            handleQuestionClick={handleQuestionClick}
            getQuestionStatus={getQuestionStatus}
            handleSubmitTest={handleSubmitTest}
            SECTION_COLORS={SECTION_COLORS}
            STATUS_COLORS={STATUS_COLORS}
            isMobile={isMobile}
            sidebarWidth="20%" // Reduced sidebar width
            sidebarBgColor="linear-gradient(90deg, #3f51b5 0%, #5c6bc0 100%)"
            transition="all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)" // Smoother animation for sidebar
          />
        )}
      </Box>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)", // Drop shadow
        }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{
            width: "100%",
            backgroundColor: "#4caf50",
            color: "white",
          }}
          icon={<CheckCircle fontSize="inherit" />}
        >
          Answer saved successfully!
        </Alert>
      </Snackbar>

      {/* Enhanced Submit Dialog */}
      <SubmitDialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        onConfirm={confirmSubmit}
        fetchResults={fetchResults} // Pass the fetchResults function
        answeredQuestions={answeredQuestionsAllSections}
        unansweredQuestions={unansweredQuestionsAllSections}
        flaggedQuestions={flaggedQuestionsAllSections}
        totalQuestions={totalQuestionsAllSections}
      />

      {timeUpDialogOpen && (
        <Dialog
          open={timeUpDialogOpen}
          onClose={() => {}}
          aria-labelledby="time-up-dialog"
          fullWidth
          maxWidth="xs"
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: 24,
            },
          }}
        >
          <DialogContent sx={{ py: 4, textAlign: "center" }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <Timer sx={{ fontSize: 60, color: "#f44336" }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#f44336",
                mb: 2,
                textAlign: "center",
              }}
            >
              Time's Up!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Your test is being automatically submitted in {timeUpCountdown}{" "}
              seconds.
            </Typography>
            <CircularProgress size={24} sx={{ color: "#f44336" }} />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default TestPage;
