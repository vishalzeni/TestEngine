import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';

const AddAdmin = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!formData.username.trim() || !formData.email.trim()) {
      setError('All fields are required');
      setOpenSnackbar(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add admin');
      }

      setSuccess('Admin added successfully!');
      setFormData({
        username: '',
        email: '',
      });
      setOpenSnackbar(true);
    } catch (err) {
      setError(err.message || 'An error occurred while adding admin');
      setOpenSnackbar(true);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 30px)',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: { xs: 2, sm: 4 },
      }}
    >
      <Typography
        variant="h3"
        gutterBottom
        sx={{
          color: '#3f51b5',
          fontWeight: 'bold',
          textAlign: 'center',
          fontFamily: 'Poppins, sans-serif',
          fontSize: { xs: '1.8rem', sm: '2.5rem' },
        }}
      >
        Add New Admin
      </Typography>

      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: '600px',
          p: { xs: 2, sm: 4 },
          borderRadius: 4,
          background: 'white',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Stack spacing={3}>
          <TextField
            label="Username *"
            variant="outlined"
            fullWidth
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter admin username"
          />

          <TextField
            label="Email *"
            variant="outlined"
            fullWidth
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter admin email"
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            onClick={handleSubmit}
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              padding: { xs: '10px', sm: '14px' },
            }}
          >
            Add Admin
          </Button>
        </Stack>
      </Paper>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? 'error' : 'success'}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddAdmin;
