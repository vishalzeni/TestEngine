import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
  useTheme,
  useMediaQuery,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  Zoom,
} from "@mui/material";
import {
  Close,
  Backspace,
  History,
  Calculate,
  Functions,
  Science,
} from "@mui/icons-material";

const Calculator = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [scientificMode, setScientificMode] = useState(false);
  const [error, setError] = useState(false);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("calculatorHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("calculatorHistory", JSON.stringify(history));
  }, [history]);

  const buttons = [
    ["7", "8", "9", "/", scientificMode ? "π" : ""],
    ["4", "5", "6", "*", scientificMode ? "√" : ""],
    ["1", "2", "3", "-", scientificMode ? "^" : ""],
    ["0", ".", "=", "+", scientificMode ? "!" : ""],
  ];

  const scientificButtons = [
    ["sin(", "cos(", "tan(", "log("],
    ["asin(", "acos(", "atan(", "ln("],
  ];

  const factorial = (n) => {
    if (n < 0) return NaN;
    return n <= 1 ? 1 : n * factorial(n - 1);
  };

  const handleClick = (value) => {
    if (value === "") return;
    setError(false);

    if (value === "=") {
      try {
        let evalExpression = expression
          .replace(/π/g, Math.PI.toString())
          .replace(/√(\d+)/g, "Math.sqrt($1)")
          .replace(/(\d+)\^(\d+)/g, "Math.pow($1,$2)")
          .replace(/(\d+)!/g, "factorial($1)")
          .replace(/sin\(/g, "Math.sin(")
          .replace(/cos\(/g, "Math.cos(")
          .replace(/tan\(/g, "Math.tan(")
          .replace(/asin\(/g, "Math.asin(")
          .replace(/acos\(/g, "Math.acos(")
          .replace(/atan\(/g, "Math.atan(")
          .replace(/log\(/g, "Math.log10(")
          .replace(/ln\(/g, "Math.log(");

        // Handle percentage calculations
        if (evalExpression.includes("%")) {
          const parts = evalExpression.split("%");
          if (parts.length === 2) {
            evalExpression = `(${parts[0]}/100)*${parts[1]}`;
          } else {
            evalExpression = parts[0] + "/100";
          }
        }

        // Use Function constructor instead of eval for better security
        const calculate = new Function("factorial", `return ${evalExpression}`);
        const evalResult = calculate(factorial);
        
        // Format the result to avoid long decimals
        const formattedResult = 
          Number.isInteger(evalResult) ? 
          evalResult.toString() : 
          parseFloat(evalResult.toFixed(10)).toString();

        setResult(formattedResult);
        setHistory((prev) => [
          { expression, result: formattedResult },
          ...prev.slice(0, 9),
        ]);
      } catch (err) {
        setResult("Error");
        setError(true);
      }
    } else {
      setExpression((prev) => prev + value);
    }
  };

  const handleClear = () => {
    setExpression("");
    setResult("");
    setError(false);
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleHistoryClick = (hist) => {
    setExpression(hist.expression);
    setResult(hist.result);
    setShowHistory(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("calculatorHistory");
  };

  const toggleScientificMode = () => {
    setScientificMode(!scientificMode);
  };

  const handleKeyDown = (e) => {
    const key = e.key;
    const validKeys = [
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
      "+", "-", "*", "/", ".", "=", "Enter", "Backspace", "Escape",
      "(", ")", "^", "!", "p", "s", "c", "t", "l", "a"
    ];

    if (key === "Enter") {
      e.preventDefault();
      handleClick("=");
    } else if (key === "Backspace") {
      e.preventDefault();
      handleBackspace();
    } else if (key === "Escape") {
      e.preventDefault();
      handleClear();
    } else if (validKeys.includes(key)) {
      // Handle special cases for scientific mode
      if (key === "p" && scientificMode) handleClick("π");
      else if (key === "s" && scientificMode) handleClick("sin(");
      else if (key === "c" && scientificMode) handleClick("cos(");
      else if (key === "t" && scientificMode) handleClick("tan(");
      else if (key === "l" && scientificMode) handleClick("log(");
      else if (key === "a" && scientificMode) handleClick("asin(");
      else if (key !== "Enter" && key !== "Backspace" && key !== "Escape") {
        handleClick(key);
      }
    }
  };

  // Add event listener for keyboard input
  useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, expression, scientificMode]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={scientificMode ? "md" : "sm"}
      fullScreen={isMobile}
      TransitionProps={{ timeout: 200 }}
      sx={{
        "& .MuiDialog-paper": {
          overflow: "hidden",
          borderRadius: isMobile ? 0 : "12px",
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: 1,
          px: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box display="flex" alignItems="center">
          <Calculate sx={{ mr: 1 }} />
          <Typography variant="h6">Calculator</Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: theme.palette.primary.contrastText }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, bgcolor: theme.palette.background.default }}>
        <Container
          maxWidth={false}
          disableGutters
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 2,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: theme.palette.background.paper,
              borderRadius: 0,
            }}
          >
            {/* Display Area */}
            <Box
              mb={2}
              px={2}
              py={1.5}
              borderRadius={2}
              bgcolor={theme.palette.grey[100]}
              sx={{
                minHeight: "100px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <Typography
                variant="h6"
                align="right"
                color={error ? "error" : "text.secondary"}
                sx={{
                  wordBreak: "break-all",
                  minHeight: "28px",
                  opacity: 0.8,
                }}
              >
                {expression || "0"}
              </Typography>
              <Typography
                variant="h3"
                align="right"
                fontWeight="bold"
                color={error ? "error" : "text.primary"}
                sx={{
                  wordBreak: "break-all",
                  minHeight: "48px",
                  lineHeight: 1.2,
                }}
              >
                {result || (error ? "Error" : "0")}
              </Typography>
            </Box>

            {/* History Dialog */}
            <Dialog
              open={showHistory}
              onClose={() => setShowHistory(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h6">Calculation History</Typography>
                  <Button
                    color="error"
                    size="small"
                    onClick={clearHistory}
                    disabled={history.length === 0}
                  >
                    Clear
                  </Button>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                {history.length === 0 ? (
                  <Typography color="text.secondary" align="center" py={2}>
                    No history yet
                  </Typography>
                ) : (
                  <List>
                    {history.map((hist, idx) => (
                      <React.Fragment key={idx}>
                        <ListItem
                          button
                          onClick={() => handleHistoryClick(hist)}
                          sx={{
                            "&:hover": {
                              bgcolor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <ListItemText
                            primary={hist.expression}
                            secondary={`= ${hist.result}`}
                            primaryTypographyProps={{
                              style: { wordBreak: "break-all" },
                            }}
                            secondaryTypographyProps={{
                              style: {
                                wordBreak: "break-all",
                                fontWeight: "bold",
                              },
                            }}
                          />
                        </ListItem>
                        {idx < history.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </DialogContent>
            </Dialog>

            <Grid container spacing={1} sx={{ flex: 1 }}>
              {/* Top Row - Special Buttons */}
              <Grid item xs={3}>
                <Tooltip title="Clear all" TransitionComponent={Zoom}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    onClick={handleClear}
                    sx={{ height: "100%", py: 1.5 }}
                  >
                    AC
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={3}>
                <Tooltip title="Backspace" TransitionComponent={Zoom}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleBackspace}
                    sx={{ height: "100%", py: 1.5 }}
                  >
                    <Backspace />
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={3}>
                <Tooltip title="History" TransitionComponent={Zoom}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setShowHistory(true)}
                    sx={{ height: "100%", py: 1.5 }}
                  >
                    <History />
                  </Button>
                </Tooltip>
              </Grid>
              <Grid item xs={3}>
                <Tooltip
                  title={scientificMode ? "Standard Mode" : "Scientific Mode"}
                  TransitionComponent={Zoom}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={toggleScientificMode}
                    color={scientificMode ? "primary" : "inherit"}
                    sx={{ height: "100%", py: 1.5 }}
                  >
                    {scientificMode ? <Science /> : <Functions />}
                  </Button>
                </Tooltip>
              </Grid>

              {/* Parentheses Buttons */}
              {scientificMode && (
                <>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleClick("(")}
                      sx={{ height: "100%", py: 1.5 }}
                    >
                      (
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleClick(")")}
                      sx={{ height: "100%", py: 1.5 }}
                    >
                      )
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleClick("%")}
                      sx={{ height: "100%", py: 1.5 }}
                    >
                      %
                    </Button>
                  </Grid>
                  <Grid item xs={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleClick(Math.PI.toString())}
                      sx={{ height: "100%", py: 1.5 }}
                    >
                      π
                    </Button>
                  </Grid>
                </>
              )}

              {/* Main Calculator Buttons */}
              {buttons.map((row, rowIndex) => (
                <React.Fragment key={rowIndex}>
                  {row.map(
                    (btn, btnIndex) =>
                      btn && (
                        <Grid
                          item
                          xs={btn === "=" ? (scientificMode ? 3 : 6) : 3}
                          key={btnIndex}
                        >
                          <Button
                            fullWidth
                            variant={
                              btn === "=" || btn === "π" || btn === "√"
                                ? "contained"
                                : "outlined"
                            }
                            color={
                              btn === "="
                                ? "primary"
                                : ["/", "*", "-", "+", "^", "!", "π", "√"].includes(btn)
                                ? "secondary"
                                : "inherit"
                            }
                            onClick={() => handleClick(btn)}
                            sx={{
                              height: "100%",
                              py: 1.5,
                              fontSize: "1.2rem",
                              fontWeight: ["=", "π", "√"].includes(btn)
                                ? "bold"
                                : "normal",
                            }}
                          >
                            {btn === "*" ? "×" : btn === "/" ? "÷" : btn}
                          </Button>
                        </Grid>
                      )
                  )}
                </React.Fragment>
              ))}

              {/* Scientific Mode Buttons */}
              {scientificMode &&
                scientificButtons.map((row, rowIndex) => (
                  <React.Fragment key={`sci-${rowIndex}`}>
                    {row.map((btn, btnIndex) => (
                      <Grid item xs={3} key={`sci-${btnIndex}`}>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="secondary"
                          onClick={() => handleClick(btn)}
                          sx={{
                            height: "100%",
                            py: 1.5,
                            fontSize: "0.9rem",
                          }}
                        >
                          {btn.replace("(", "")}
                        </Button>
                      </Grid>
                    ))}
                  </React.Fragment>
                ))}
            </Grid>
          </Paper>
        </Container>
      </DialogContent>
    </Dialog>
  );
};

export default Calculator;