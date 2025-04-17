import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Snackbar,
  Alert,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

import * as XLSX from "xlsx";
import axios from "axios";

const AddTestPage = () => {
  // State management
  const [testName, setTestName] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [sections, setSections] = useState([
    { name: "", duration: "", file: null },
  ]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);
  const [negativeMarkingValue, setNegativeMarkingValue] = useState("0.25");
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [calculatorEnabled, setCalculatorEnabled] = useState(false);

  // Helper functions
  const showSnackbar = (severity, message) => {
    setSnackbarSeverity(severity);
    setSnackbarMessage(message);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const checkTestNameExists = async (name) => {
    if (!name.trim()) return;
  
    try {
      const response = await axios.get(
        `http://localhost:5000/api/tests/${encodeURIComponent(name)}`
      );
      if (response.status === 200) {
        showSnackbar("error", "Test name already exists!");
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        showSnackbar("success", "Test name is available!");
      } else {
        console.error("Error checking test name:", error);
      }
    }
  };

  // Section management
  const handleAddSection = () => {
    if (sections.length >= 30) {
      showSnackbar("warning", "Maximum 30 sections allowed!");
      return;
    }
    setSections([...sections, { name: "", duration: "", file: null }]);
    showSnackbar("success", "New section added!");
  };

  const handleRemoveSection = (index) => {
    if (sections.length > 1) {
      setConfirmDeleteIndex(index);
    }
  };

  const confirmRemoveSection = () => {
    const newSections = [...sections];
    newSections.splice(confirmDeleteIndex, 1);
    setSections(newSections);
    setConfirmDeleteIndex(null);
    showSnackbar("success", "Section removed!");
  };

  const handleSectionNameChange = (index, value) => {
    const newSections = [...sections];
    newSections[index].name = value.trimStart();
    setSections(newSections);
  };

  const handleSectionDurationChange = (index, value) => {
    const newSections = [...sections];
    newSections[index].duration = value.trim();
    setSections(newSections);
  };

  // File handling
  const handleFileChange = async (index, file) => {
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      showSnackbar(
        "error",
        "Invalid file type. Please upload Excel (.xlsx, .xls) or CSV files."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar("error", "File size should be less than 5MB");
      return;
    }

    const newSections = [...sections];
    newSections[index].file = file;
    setSections(newSections);
    showSnackbar("success", "File selected successfully!");
  };

  // Validation functions
  const validateExcelData = (jsonData) => {
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      throw new Error("Excel file is empty or invalid format");
    }

    const requiredColumns = [
      "question",
      "optionA",
      "optionB",
      "optionC",
      "optionD",
      "correctAnswer",
    ];
    const firstRow = jsonData[0];

    const missingColumns = requiredColumns.filter((col) => !(col in firstRow));
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
    }
  };

  const extractQuestionsFromExcel = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          validateExcelData(jsonData);

          const questions = jsonData.map((row, index) => ({
            id: Date.now() + index,
            question: row.question || "",
            questionImage: row.questionImage || "",
            options: [
              { text: row.optionA || "", image: row.optionAimg || "" },
              { text: row.optionB || "", image: row.optionBimg || "" },
              { text: row.optionC || "", image: row.optionCimg || "" },
              { text: row.optionD || "", image: row.optionDimg || "" },
            ],
            correctAnswer: row.correctAnswer || "",
            explanation: row.explanation || "",
            explanationImage: row.explanationImage || "",
            section: sections.find((s) => s.file === file)?.name || "",
          }));

          resolve(questions);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  // Form submission
  const handleAddTest = async () => {
    // Validation checks
    if (!testName.trim()) {
      showSnackbar("error", "Please enter a valid test name!");
      return;
    }

    if (!startDateTime.trim() || !endDateTime.trim()) {
      showSnackbar("error", "Please select both start and end date/time!");
      return;
    }

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      showSnackbar("error", "End date/time must be after start date/time!");
      return;
    }

    if (isNaN(marksPerQuestion) || marksPerQuestion <= 0) {
      showSnackbar("error", "Please enter valid marks per question!");
      return;
    }

    const sectionValidation = sections.every(
      (section) =>
        section.name.trim() &&
        section.duration.trim() &&
        !isNaN(section.duration) &&
        section.duration > 0 &&
        section.file
    );

    if (!sectionValidation) {
      showSnackbar(
        "error",
        "Please fill all section details with valid durations and select files!"
      );
      return;
    }

    const sectionNames = sections.map((section) =>
      section.name.trim().toLowerCase()
    );
    const uniqueSectionNames = new Set(sectionNames);
    if (sectionNames.length !== uniqueSectionNames.size) {
      showSnackbar("error", "Section names must be unique!");
      return;
    }

    setIsLoading(true);

    try {
      const extractedData = await Promise.all(
        sections.map(async (section) => {
          const questions = await extractQuestionsFromExcel(section.file);
          return {
            sectionName: section.name.trim(),
            duration: section.duration.trim(),
            questions,
          };
        })
      );

      const testPayload = {
        name: testName.trim(),
        startDateTime,
        endDateTime,
        sections: extractedData,
        marksPerQuestion: parseFloat(marksPerQuestion),
        negativeMarking: negativeMarkingEnabled
          ? parseFloat(negativeMarkingValue)
          : 0,
        calculatorEnabled, // Include calculator toggle in payload
      };

      // Replace with your actual API endpoint
      const response = await axios.post(
        "http://localhost:5000/api/tests",
        testPayload
      );

      if (response.status !== 201) throw new Error("Failed to create test");

      showSnackbar("success", "Test created successfully!");
      // Reset form after successful submission
      setTestName("");
      setStartDateTime("");
      setEndDateTime("");
      setSections([{ name: "", duration: "", file: null }]);
      setNegativeMarkingEnabled(false);
      setMarksPerQuestion(1);
      setCalculatorEnabled(false); // Reset calculator toggle
    } catch (error) {
      console.error("Error creating test:", error);
      showSnackbar("error", `Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      testName.trim() &&
      startDateTime.trim() &&
      endDateTime.trim() &&
      new Date(startDateTime) < new Date(endDateTime) &&
      marksPerQuestion > 0 &&
      sections.every(
        (section) =>
          section.name.trim() &&
          section.duration.trim() &&
          !isNaN(section.duration) &&
          section.duration > 0 &&
          section.file
      )
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 30px)", // Adjust for header height
        overflow: "hidden", // Prevent scrolling
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        padding: "15px",
      }}
    >
      {/* Main Heading */}
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          color: "#3f51b5",
          fontWeight: "bold",
          textAlign: "center",
          fontFamily: "Poppins, sans-serif",
        }}
      >
        Create Test
      </Typography>

      <Box
        sx={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          flexDirection: { xs: "column", md: "row" }, // Stack on small screens, row on larger screens
          gap: 2,
          position: "relative",
        }}
      >
        {/* Top-right corner buttons */}
        <Box
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            gap: 2,
            flexDirection: { xs: "column", sm: "row" }, // Stack buttons on smaller screens
          }}
        >
          <Tooltip title="Add Section">
            <IconButton
              onClick={handleAddSection}
              disabled={sections.length >= 30}
              sx={{
                backgroundColor: "#3f51b5",
                color: "white",
                "&:hover": { backgroundColor: "#303f9f" },
                "&:disabled": { backgroundColor: "#e0e0e0", color: "#9e9e9e" },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Save Test">
            <IconButton
              onClick={handleAddTest}
              disabled={!isFormValid() || isLoading}
              sx={{
                backgroundColor: "#4caf50",
                color: "white",
                "&:hover": { backgroundColor: "#388e3c" },
                "&:disabled": { backgroundColor: "#e0e0e0", color: "#9e9e9e" },
              }}
            >
              <SaveIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Left Side - Test Information */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            p: { xs: 2, md: 4 }, // Adjust padding for smaller screens
            borderRadius: 4,
            background: "white",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              color: "#3f51b5",
              fontWeight: "bold",
              textAlign: "center",
              mb: 3,
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Test Information
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Test Name *"
              variant="outlined"
              fullWidth
              value={testName}
              onChange={(e) => {
                setTestName(e.target.value);
                checkTestNameExists(e.target.value);
              }}
              placeholder="Enter test name"
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#3f51b5",
                  },
                  "&:hover fieldset": {
                    borderColor: "#3f51b5",
                  },
                },
              }}
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Start Date & Time *"
                type="datetime-local"
                variant="outlined"
                fullWidth
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Test will be available from this time"
              />

              <TextField
                label="End Date & Time *"
                type="datetime-local"
                variant="outlined"
                fullWidth
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Test will be unavailable after this time"
              />
            </Box>

            <TextField
              label="Marks Per Question *"
              type="number"
              variant="outlined"
              fullWidth
              value={marksPerQuestion}
              onChange={(e) => setMarksPerQuestion(e.target.value)}
              placeholder="Enter marks per question"
              InputProps={{
                inputProps: { min: 0.25, step: 0.25 },
              }}
              helperText="Enter the marks awarded for each correct answer"
            />
            <Box sx={{ display: "flex", gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={calculatorEnabled}
                  onChange={(e) => setCalculatorEnabled(e.target.checked)}
                  color="primary"
                />
              }
              label="Enable Calculator"
            />
              </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={negativeMarkingEnabled}
                    onChange={(e) =>
                      setNegativeMarkingEnabled(e.target.checked)
                    }
                    color="primary"
                  />
                }
                label="Enable Negative Marking"
              />
              {negativeMarkingEnabled && (
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <FormLabel>Negative Marking Value *</FormLabel>
                  <RadioGroup
                    value={negativeMarkingValue}
                    onChange={(e) => setNegativeMarkingValue(e.target.value)}
                    row
                  >
                    <FormControlLabel
                      value="0.25"
                      control={<Radio />}
                      label="25%"
                    />
                    <FormControlLabel
                      value="0.50"
                      control={<Radio />}
                      label="50%"
                    />
                    <FormControlLabel
                      value="0.75"
                      control={<Radio />}
                      label="75%"
                    />
                    <FormControlLabel
                      value="1.00"
                      control={<Radio />}
                      label="100%"
                    />
                  </RadioGroup>
                  <Typography variant="caption" color="textSecondary">
                    Percentage of marks deducted for wrong answers
                  </Typography>
                </FormControl>
              )}
            </Box>

           
          </Stack>
        </Paper>

        {/* Right Side - Sections */}
        <Paper
          elevation={3}
          sx={{
            flex: 1,
            p: { xs: 2, md: 4 }, // Adjust padding for smaller screens
            borderRadius: 4,
            background: "white",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              color: "#3f51b5",
              fontWeight: "bold",
              textAlign: "center",
              mb: 3,
              fontFamily: "Poppins, sans-serif",
              fontSize: { xs: "1.5rem", md: "2rem" }, // Adjust font size for smaller screens
            }}
          >
            Sections ({sections.length}/30)
          </Typography>
          <Grid container spacing={3}>
            {sections.map((section, index) => (
              <Grid item xs={12} sm={6} key={index}>
                {/* Adjust section card layout */}
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: "#ffffff",
                    position: "relative",
                    borderLeft: "4px solid #3f51b5",
                  }}
                >
                  {sections.length > 1 && (
                    <IconButton
                      onClick={() => handleRemoveSection(index)}
                      sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: "#ff5252",
                        "&:hover": {
                          backgroundColor: "rgba(255, 82, 82, 0.1)",
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}

                  <Stack spacing={2}>
                    <Typography variant="subtitle2" sx={{ color: "#3f51b5" }}>
                      Section {index + 1}
                    </Typography>

                    <TextField
                      label="Section Name *"
                      variant="outlined"
                      fullWidth
                      value={section.name}
                      onChange={(e) =>
                        handleSectionNameChange(index, e.target.value)
                      }
                      placeholder="Enter section name"
                    />

                    <TextField
                      label="Section Duration (minutes) *"
                      variant="outlined"
                      fullWidth
                      type="number"
                      value={section.duration}
                      onChange={(e) =>
                        handleSectionDurationChange(index, e.target.value)
                      }
                      placeholder="Enter duration in minutes"
                      InputProps={{
                        inputProps: { min: 1 },
                      }}
                      helperText="Time allocated for this section"
                    />

                    <Box>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<InsertDriveFileIcon />}
                        sx={{
                          textTransform: "none",
                          borderColor: "#3f51b5",
                          color: "#3f51b5",
                          "&:hover": {
                            backgroundColor: "rgba(63, 81, 181, 0.08)",
                            borderColor: "#303f9f",
                          },
                        }}
                      >
                        Upload Excel File *
                        <input
                          type="file"
                          hidden
                          accept=".xlsx, .xls, .csv"
                          onChange={(e) =>
                            handleFileChange(index, e.target.files[0])
                          }
                          multiple={false}
                        />
                      </Button>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mt: 1, color: "text.secondary" }}
                      >
                        Supported formats: .xlsx, .xls, .csv
                      </Typography>
                    </Box>

                    {section.file && (
                      <Chip
                        avatar={
                          <Avatar sx={{ bgcolor: "#e8f5e9" }}>
                            <InsertDriveFileIcon
                              fontSize="small"
                              color="success"
                            />
                          </Avatar>
                        }
                        label={
                          section.file.name.length > 20
                            ? `${section.file.name.substring(
                                0,
                                15
                              )}...${section.file.name.substring(
                                section.file.name.lastIndexOf(".")
                              )}`
                            : section.file.name
                        }
                        onDelete={() => handleFileChange(index, null)}
                        sx={{
                          backgroundColor: "#e8f5e9",
                          color: "#2e7d32",
                          "& .MuiChip-deleteIcon": {
                            color: "#2e7d32",
                          },
                        }}
                        title={section.file.name}
                      />
                    )}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>

      {/* Excel Template Dialog */}
      <Dialog
        open={openTemplateDialog}
        onClose={() => setOpenTemplateDialog(false)}
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Excel File Requirements</Typography>
            <IconButton onClick={() => setOpenTemplateDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            <Typography paragraph>
              Please ensure your Excel file follows this format:
            </Typography>
            <Typography component="div">
              <ul>
                <li>
                  <strong>Required columns:</strong> question, optionA, optionB,
                  optionC, optionD, correctAnswer
                </li>
                <li>
                  <strong>Optional columns:</strong> questionImage, optionAimg,
                  optionBimg, optionCimg, optionDimg, explanation,
                  explanationImage
                </li>
                <li>
                  <strong>Correct answer format:</strong> A, B, C, or D
                  (corresponding to the options)
                </li>
                <li>
                  <strong>Image columns:</strong> Should contain image URLs or
                  base64 encoded strings
                </li>
              </ul>
            </Typography>
            <Typography paragraph>
              <Button
                variant="contained"
                color="primary"
                href="/templates/question_template.xlsx"
                download
                sx={{ mt: 2 }}
              >
                Download Template
              </Button>
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTemplateDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteIndex !== null}
        onClose={() => setConfirmDeleteIndex(null)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this section? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteIndex(null)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={confirmRemoveSection}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddTestPage;
