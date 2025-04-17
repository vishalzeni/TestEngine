import React from "react";
import {
  Box,
  Typography,
  Button,
  Tooltip,
} from "@mui/material";
import { CheckCircle, Bookmark } from "@mui/icons-material";

const ProgressPanel = ({
  test,
  currentSectionIndex, // Updated to use currentSectionIndex
  currentQuestionIndex,
  answeredQuestions,
  totalQuestions,
  handleQuestionClick,
  getQuestionStatus,
  handleSubmitTest,
  STATUS_COLORS,
  sidebarWidth = "20%", // Reduced width
  sidebarBgColor = "#fafafa", // Sidebar background color
}) => {
  return (
    <Box
      sx={{
        width: { xs: "100%", md: sidebarWidth }, // Use dynamic width
        background: sidebarBgColor, // Apply sidebar background color
        p:1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        color: "white", // Set text color to white
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)", // Drop shadow
        transition: "all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)", // Smoother animation for sidebar
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 1 },
          overflowY: "auto",
          "&::-webkit-scrollbar": { display: "none" },
          "&:hover::-webkit-scrollbar": { display: "block" },
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgb(233, 233, 233)",
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#fff",
            cursor: "arrow",
          },
        }}
      >
        {/* Legend Section */}
        <Box
          sx={{
            mb: 2,
            p: { xs: 1, sm: 1.5 },
            backgroundColor: "rgba(255, 255, 255, 0.1)", // Semi-transparent white
            borderRadius: 1,
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)", // Drop shadow
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              fontWeight: 600,
              color: "#fff", // Light grey text
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            Question Status
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            {[
              { color: STATUS_COLORS.current, label: "Current" },
              { color: STATUS_COLORS.answered, label: "Answered" },
              { color: STATUS_COLORS.saved, label: "Unanswered" },
              { color: STATUS_COLORS.flagged, label: "Flagged" },
              { color: STATUS_COLORS.visited, label: "Visited" },
              {
                color: "white",
                label: "Not Viewed",
                border: "#bdbdbd",
              },
            ].map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: item.color,
                    border: item.border
                      ? `1px solid ${item.border}`
                      : "none",
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: "#fff", // Light grey text
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Questions Grid */}
        <Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(30px, 1fr))",
              gap: 1,
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)", // Drop shadow
              transition: "all 0.3s ease-in-out", // Smooth transition for grid changes
            }}
          >
            {test?.sections?.[currentSectionIndex]?.questions?.map((q, questionIndex) => {
              const questionId = q.id;
              const status = getQuestionStatus(questionId, questionIndex); // Ensure this function works for all sections
              const isCurrent = status === "current";

              return (
                <Tooltip
                  key={questionIndex}
                  title={`Question ${questionIndex + 1}`}
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
                    onClick={() => handleQuestionClick(questionIndex)}
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${
                        status === "notViewed" ? "#bdbdbd" : STATUS_COLORS[status]
                      }`,
                      backgroundColor:
                        status === "notViewed"
                          ? "white" // White-filled for "not viewed"
                          : isCurrent
                          ? STATUS_COLORS.current
                          : ["answered", "saved", "flagged", "visited"].includes(
                              status
                            )
                          ? STATUS_COLORS[status]
                          : "transparent",
                      color: isCurrent
                        ? "white"
                        : status === "notViewed"
                        ? "#616161" // Grey text for "not viewed"
                        : ["answered", "saved", "flagged"].includes(status)
                        ? "white"
                        : "#fff", // Light grey text
                      cursor: "pointer",
                      transition: "all 0.3s ease-in-out", // Smooth transition for hover and state changes
                      position: "relative",
                      "&:hover": {
                        transform: "scale(1.1)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      },
                      fontWeight:  "normal",
                    }}
                  >
                    {questionIndex + 1}
                    {status === "flagged" && (
                      <Bookmark
                        sx={{
                          position: "absolute",
                          top: -4,
                          right: -4,
                          fontSize: 12,
                          color: STATUS_COLORS.flagged,
                        }}
                      />
                    )}
                    {status === "answered" && !isCurrent && (
                      <CheckCircle
                        sx={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          fontSize: 12,
                          color: "white",
                          backgroundColor: STATUS_COLORS.answered,
                          borderRadius: "50%",
                          padding: "2px",
                        }}
                      />
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      </Box>

      {/* Submit Button */}
      <Button
        variant="contained"
        onClick={handleSubmitTest}
        sx={{
          mt: 2,
          py: 1,
          backgroundColor: "#4caf50",
          color: "white",
          fontSize: "0.875rem",
          fontWeight: 600,
          mb:2,
          "&:hover": {
            backgroundColor: "#388e3c",
          },
        }}
        startIcon={<CheckCircle fontSize="small" />}
      >
        Submit Test
      </Button>
    </Box>
  );
};

export default ProgressPanel;
