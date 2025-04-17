import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, TextField, Button, Paper, Box, Alert,
  Snackbar, IconButton, Fade, Slide, Avatar, CssBaseline
} from '@mui/material';
import {
  Lock as LockIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.02); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.6; }
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
  '&:before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(63,94,251,0.05) 0%, rgba(252,70,107,0) 70%)',
    animation: `${pulse} 10s infinite alternate`,
    zIndex: 0
  }
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
    boxShadow: '0 3px 7px 3px rgba(33, 150, 243, .2)'
  },
  '&:disabled': {
    background: '#e0e0e0'
  }
}));

const AdminSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const { username, password, confirmPassword } = formData;

    if (!username || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      setSnackbarMessage('Signup successful! Redirecting to login...');
      setSnackbarOpen(true);

      setTimeout(() => {
        navigate('/admin-login', { state: { registrationSuccess: 'Admin registered successfully!' } });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Signup error');
      setSnackbarMessage(err.message || 'Signup error');
      setSnackbarOpen(true);
    }
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
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%)',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
    >
      <CssBaseline />
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2
        }}
      >
        <Slide direction="down" in={true} mountOnEnter unmountOnExit>
          <Avatar
            sx={{
              m: 1,
              bgcolor: 'primary.main',
              width: 56,
              height: 56,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
          >
            <PersonIcon fontSize="medium" />
          </Avatar>
        </Slide>

        <Typography component="h1" variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Admin Signup
        </Typography>

        <AuthPaper elevation={6} sx={{ p: 3 }}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <IconButton
              sx={{ position: 'absolute', left: 0, top: -10, color: 'text.secondary' }}
              onClick={() => navigate('/admin-login')}
            >
              <ArrowBackIcon />
            </IconButton>

            <Typography
              component="h2"
              variant="subtitle1"
              align="center"
              sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}
            >
              Create your admin account
            </Typography>

            {error && (
              <Fade in={!!error}>
                <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>
                  {error}
                </Alert>
              </Fade>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
              <TextField
                fullWidth
                margin="normal"
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                required
                autoFocus
                InputProps={{
                  startAdornment: (
                    <PersonIcon sx={{ color: 'action.active', mr: 1, fontSize: '20px' }} />
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'primary.main' }
                  }
                }}
              />

              <TextField
                fullWidth
                margin="normal"
                name="password"
                label="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <LockIcon sx={{ color: 'action.active', mr: 1, fontSize: '20px' }} />
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'primary.main' }
                  }
                }}
              />

              <TextField
                fullWidth
                margin="normal"
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                InputProps={{
                  startAdornment: (
                    <LockIcon sx={{ color: 'action.active', mr: 1, fontSize: '20px' }} />
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '& fieldset': { borderColor: 'divider' },
                    '&:hover fieldset': { borderColor: 'primary.main' }
                  }
                }}
              />

              <GradientButton
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Register
              </GradientButton>
            </Box>
          </Box>
        </AuthPaper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={(props) => <Slide {...props} direction="up" />}
      >
        <Alert
          severity={error ? 'error' : 'success'}
          onClose={() => setSnackbarOpen(false)}
          sx={{
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={() => setSnackbarOpen(false)}
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

export default AdminSignup;
