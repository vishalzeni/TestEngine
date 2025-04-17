import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Alert,
  Snackbar,
  IconButton,
  Slide,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Lock as LockIcon,
  AccountCircle as AccountCircleIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const AuthPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  animation: `${fadeIn} 0.5s ease-out`,
  background: 'linear-gradient(145deg, #ffffff 0%, #f3f6f9 100%)',
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(31, 38, 135, 0.1)',
  position: 'relative',
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.3)',
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #1976d2 0%, #2196f3 100%)',
  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .15)',
  borderRadius: '12px',
  padding: '12px 0',
  fontWeight: 'bold',
  letterSpacing: '0.5px',
  '&:hover': {
    background: 'linear-gradient(45deg, #1565c0 0%, #1976d2 100%)',
    boxShadow: '0 3px 7px 3px rgba(33, 150, 243, .2)',
  },
  '&:disabled': {
    background: '#e0e0e0',
  },
}));

const StudentLogin = () => {
  const [formData, setFormData] = useState({ rollNumber: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [forgotPasswordDialogOpen, setForgotPasswordDialogOpen] = useState(false);
  const [resetFormData, setResetFormData] = useState({ rollNumber: '', email: '', newPassword: '', confirmPassword: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResetChange = (e) => {
    setResetFormData({ ...resetFormData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    if (!formData.rollNumber || !formData.password) {
      setError('Both fields are required');
      setLoading(false);
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/api/students/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          rollNumber: formData.rollNumber.trim().toLowerCase(), // Ensure lowercase
          password: formData.password
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
  
      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received');
      }
  
      localStorage.setItem('token', data.token);
      localStorage.setItem('student', JSON.stringify(data.student));
  
      setSnackbarMessage('Login successful! Redirecting...');
      setSnackbarOpen(true);
  
      setTimeout(() => navigate('/home'), 1500);
      window.location.reload(); // Reload the page to reflect the new state
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.message || 
                      (err.response?.data?.message || 'Login failed. Please try again.');
      setError(errorMsg);
      setSnackbarMessage(errorMsg);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetFormData.rollNumber || !resetFormData.email || 
        !resetFormData.newPassword || !resetFormData.confirmPassword) {
      setError('All fields are required for password reset');
      return;
    }
  
    if (resetFormData.newPassword !== resetFormData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
  
    // Add password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(resetFormData.newPassword)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number and special character');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/api/students/forgot-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          rollNumber: resetFormData.rollNumber.trim(),
          email: resetFormData.email.trim().toLowerCase(),
          newPassword: resetFormData.newPassword
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
  
      setSnackbarMessage('Password reset successfully! You can now login with your new password');
      setSnackbarOpen(true);
      setForgotPasswordDialogOpen(false);
      setResetFormData({
        rollNumber: '',
        email: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message || 'An error occurred while resetting password');
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleDialogClose = () => {
    setForgotPasswordDialogOpen(false);
    setResetFormData({ rollNumber: '', email: '', newPassword: '', confirmPassword: '' });
    setError('');
  };

  return (
    <Container
      component="main"
      maxWidth={false}
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          px: 2,
        }}
      >
        <Slide direction="down" in={true} mountOnEnter unmountOnExit>
          <Avatar
            sx={{
              m: 1,
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            }}
          >
            <LockIcon fontSize="medium" />
          </Avatar>
        </Slide>

        <Typography
          component="h1"
          variant="h5"
          sx={{
            mb: 2,
            fontWeight: 700,
            color: 'text.primary',
            textAlign: 'center',
          }}
        >
          Student Login
        </Typography>

        <AuthPaper elevation={6} sx={{ p: 3 }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <IconButton
              sx={{
                position: 'absolute',
                left: 0,
                top: -10,
                color: 'text.secondary',
              }}
              onClick={() => navigate('/')}
            >
              <ArrowBackIcon />
            </IconButton>

            <Typography
              component="h2"
              variant="subtitle1"
              align="center"
              sx={{
                mb: 2,
                fontWeight: 600,
                color: 'text.secondary',
              }}
            >
              Sign in to your account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="rollNumber"
                label="Roll Number"
                name="rollNumber"
                autoComplete="rollNumber"
                autoFocus
                value={formData.rollNumber}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <AccountCircleIcon
                      sx={{
                        color: 'action.active',
                        mr: 1,
                        fontSize: '20px',
                      }}
                    />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <LockIcon
                      sx={{
                        color: 'action.active',
                        mr: 1,
                        fontSize: '20px',
                      }}
                    />
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '& fieldset': {
                      borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              />

              <GradientButton
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </GradientButton>

              <Box
                textAlign="center"
                mt={2}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Button
                  color="primary"
                  onClick={() => setForgotPasswordDialogOpen(true)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 'bold',
                    p: 0,
                    minWidth: 'auto',
                  }}
                >
                  Forgot Password?
                </Button>
              </Box>
            </Box>
          </Box>
        </AuthPaper>
      </Box>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="normal"
            fullWidth
            label="Roll Number"
            name="rollNumber"
            value={resetFormData.rollNumber}
            onChange={handleResetChange}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={resetFormData.email}
            onChange={handleResetChange}
          />
          <TextField
            margin="normal"
            fullWidth
            label="New Password"
            name="newPassword"
            type="password"
            value={resetFormData.newPassword}
            onChange={handleResetChange}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={resetFormData.confirmPassword}
            onChange={handleResetChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleForgotPassword} color="primary">
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={(props) => <Slide {...props} direction="up" />}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          onClose={handleSnackbarClose}
          sx={{
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StudentLogin;