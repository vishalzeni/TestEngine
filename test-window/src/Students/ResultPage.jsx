import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme,
  Stack,
  Chip,
  Paper,
  LinearProgress,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import ReactConfetti from "react-confetti";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CloseIcon from "@mui/icons-material/Close";

const ResultPage = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [overallStats, setOverallStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    accuracy: 0,
    totalScore: 0,
    maxScore: 0,
  });
  const [showConfetti, setShowConfetti] = useState(true);
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  useEffect(() => {
    const calculateResults = () => {
      const test = location.state?.test || null;
      const answers = location.state?.answers || {};
      const progress = location.state?.progress || {};
      const attempted = location.state?.attempted || 0;
      const total = location.state?.total || 0;
      const negativeMarking = test?.negativeMarking || 0; // Fetch negative marking value from DB
      const marksPerQuestion = test?.marksPerQuestion || 1; // Fetch marks per question from DB
      setAutoSubmitted(location.state?.autoSubmitted || false);

      if (!test || !test.sections || test.sections.length === 0) {
        console.error("No sections found in the test data.");
        return [];
      }

      let stats = {
        total: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        totalScore: 0,
        maxScore: 0,
      };

      const calculatedResults = test.sections.map((sections) => {
        const total = sections.questions?.length || 0;
        stats.total += total;
        let correct = 0;
        let incorrect = 0;
        let attempted = 0;

        sections.questions?.forEach((question, index) => {
          const questionId = question.id;
          const isSaved = progress[sections.sectionName]?.[index];
          if (isSaved) {
            attempted++;
            const userAnswer = answers[questionId]?.trim().toLowerCase();
            const correctOptionIndex = ["a", "b", "c", "d"].indexOf(
              question.correctAnswer?.trim().toLowerCase()
            );
            const correctAnswerValue =
              correctOptionIndex !== -1
                ? question.options[correctOptionIndex]?.text
                    ?.trim()
                    .toLowerCase()
                : null;

            if (userAnswer === correctAnswerValue) {
              correct++;
              stats.correct++;
              stats.totalScore += marksPerQuestion; // Add marks for correct answer
            } else if (userAnswer) {
              incorrect++;
              stats.incorrect++;
              stats.totalScore -= marksPerQuestion * negativeMarking; // Subtract marks for incorrect answer
            }
          }
        });

        const unanswered = total - attempted;
        stats.unanswered += unanswered;
        stats.maxScore += total * marksPerQuestion; // Calculate maximum possible score

        return {
          section: sections.sectionName,
          total,
          attempted,
          correct,
          incorrect,
          unanswered,
          accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
          performance: Math.round(
            ((correct - incorrect * negativeMarking) / total) * 100
          ),
        };
      });

      setOverallStats({
        ...stats,
        attempted,
        total,
        accuracy:
          stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        performance: Math.round(
          ((stats.correct - stats.incorrect * negativeMarking) / stats.total) *
            100
        ),
      });

      return calculatedResults;
    };

    setResults(calculateResults());

    // Stop confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, [location.state]);

  const COLORS = [
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
  ];

  const getPerformanceRating = (accuracy) => {
    if (accuracy >= 85) return { text: "Excellent", color: "success" };
    if (accuracy >= 70) return { text: "Good", color: "success" };
    if (accuracy >= 50) return { text: "Average", color: "warning" };
    return { text: "Needs Improvement", color: "error" };
  };

  const handleClose = () => {
    navigate("/");
  };

  return (
    <Box
      sx={{
        background:
          "linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #42a5f5 100%)",
        width: "100%",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: "absolute",
          right: 16,
          top: 16,
          color: "white",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.3)",
          },
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box
        sx={{
          p: { xs: 2, md: 4 },
          maxWidth: 1300,
          margin: "0 auto",
        }}
      >
        {showConfetti && <ReactConfetti />}
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            textAlign: "center",
            fontWeight: 700,
            color: "#fff",
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
          }}
        >
          Test Performance Report
        </Typography>

        {autoSubmitted && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: "#fffde7", // softer yellow
              border: "1px solid #ffe082",
              borderRadius: 1,
              boxShadow: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.5,
            }}
          >
            <WarningAmberRoundedIcon sx={{ color: "#f57c00" }} />
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: "#f57c00" }}
            >
              The test was automatically submitted because the time ran out.
            </Typography>
          </Box>
        )}

        {/* Overall Performance Summary */}
        <Card sx={{ mb: 4, borderRadius: 1, boxShadow: 3 }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, color: "#0d47a1" }}>
                    Overall Score
                  </Typography>
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <CircularProgress
                      variant="determinate"
                      value={overallStats.accuracy}
                      size={120}
                      thickness={4}
                      color={
                        overallStats.accuracy > 70
                          ? "success"
                          : overallStats.accuracy > 40
                          ? "warning"
                          : "error"
                      }
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: "absolute",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        variant="h4"
                        component="div"
                        style={{ color: "#1976d2" }}
                      >
                        {overallStats.totalScore.toFixed(2)}/
                        {overallStats.maxScore}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 1, color: "#0d47a1" }}
                  >
                    {getPerformanceRating(overallStats.accuracy).text}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <StatCard
                      title="Attempted"
                      value={overallStats.attempted}
                      total={overallStats.total}
                      color="info"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <StatCard
                      title="Correct"
                      value={overallStats.correct}
                      total={overallStats.total}
                      color="success"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <StatCard
                      title="Incorrect"
                      value={overallStats.incorrect}
                      total={overallStats.total}
                      color="error"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <StatCard
                      title="Unanswered"
                      value={overallStats.unanswered}
                      total={overallStats.total}
                      color="warning"
                    />
                  </Grid>
                  <Grid item xs={4}>
                    <StatCard
                      title="Total"
                      value={overallStats.total}
                      total={overallStats.total}
                      color="primary"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Paper
                      elevation={0}
                      sx={{ p: 2, background: theme.palette.grey[50] }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 1,
                          color: "#000",
                          textShadow: "1px 1px 2px rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        Performance Breakdown
                      </Typography>
                      <Stack spacing={1}>
                        {results.map((section) => (
                          <Box key={section.section}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#fff",
                                  textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                                }}
                              >
                                {section.section}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {section.performance}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={section.performance}
                              color={
                                section.performance > 70
                                  ? "success"
                                  : section.performance > 40
                                  ? "warning"
                                  : "error"
                              }
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Section-wise Analysis */}
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            fontWeight: 600,
            color: "#fff",
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
          }}
        >
          Section Analysis
        </Typography>

        <Grid container spacing={3}>
          {results.map((section, index) => (
            <Grid item xs={12} md={6} key={index}>
              <SectionCard section={section} colors={COLORS} theme={theme} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, total, color }) => (
  <Paper elevation={2} sx={{ p: 2, textAlign: "center" }}>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      {title}
    </Typography>
    <Typography variant="h4" color={`${color}.main`} sx={{ fontWeight: 700 }}>
      {value}
    </Typography>
    <Typography variant="caption">
      {Math.round((value / total) * 100)}% of total
    </Typography>
  </Paper>
);

// Reusable Section Card Component
const SectionCard = ({ section, colors, theme }) => {
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
    const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontWeight: "bold", fontSize: 12 }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const pieData = [
    { name: "Correct", value: section.correct },
    { name: "Incorrect", value: section.incorrect },
    { name: "Unanswered", value: section.unanswered },
  ];

  return (
    <Card
      sx={{
        height: "100%",
        transition: "transform 0.3s",
        "&:hover": { transform: "translateY(-5px)" },
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {section.section}
          <Chip
            label={`${section.performance}%`}
            color={
              section.performance > 70
                ? "success"
                : section.performance > 40
                ? "warning"
                : "error"
            }
            size="small"
            sx={{ ml: 1 }}
          />
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  label={renderCustomizedLabel}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Grid>

          <Grid item xs={12} md={7}>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption">
                  Attempted: {section.attempted}/{section.total}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(section.attempted / section.total) * 100}
                  sx={{ height: 8, mt: 0.5 }}
                />
              </Box>

              <Box>
                <Typography variant="caption">
                  Accuracy: {section.accuracy}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={section.accuracy}
                  color={
                    section.accuracy > 70
                      ? "success"
                      : section.accuracy > 40
                      ? "warning"
                      : "error"
                  }
                  sx={{ height: 8, mt: 0.5 }}
                />
              </Box>

              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid item xs={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      textAlign: "center",
                      background: theme.palette.success.light,
                    }}
                  >
                    <Typography variant="body2" color="success.dark">
                      Correct
                    </Typography>
                    <Typography variant="h6" color="success.dark">
                      {section.correct}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      textAlign: "center",
                      background: theme.palette.error.light,
                    }}
                  >
                    <Typography variant="body2" color="error.dark">
                      Incorrect
                    </Typography>
                    <Typography variant="h6" color="error.dark">
                      {section.incorrect}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1,
                      textAlign: "center",
                      background: theme.palette.warning.light,
                    }}
                  >
                    <Typography variant="body2" color="warning.dark">
                      Unanswered
                    </Typography>
                    <Typography variant="h6" color="warning.dark">
                      {section.unanswered}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ResultPage;