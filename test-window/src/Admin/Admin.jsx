import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  AppBar, 
  Toolbar, 
  Button, 
  Divider, 
  IconButton, 
  useTheme, 
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  ExitToApp as ExitToAppIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';

const Admin = ({ onLogout }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [adminName, setAdminName] = useState('');
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  useEffect(() => {
    try {
      const admin = JSON.parse(localStorage.getItem('admin'));
      const token = localStorage.getItem('adminToken');
      
      if (!admin || !token) {
        navigate('/admin-login');
        return;
      }
      
      // Optional: Verify token with backend
      setAdminName(admin.username);
    } catch (error) {
      navigate('/admin-login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('adminToken');
    onLogout(); // Call the parent-provided logout handler
    navigate('/');
  };

  const adminCards = [
    {
      title: 'Add Student',
      description: 'Add a new student to the platform',
      icon: <PeopleIcon fontSize="large" sx={{ color: '#fff' }} />,
      path: '/add-student',
      gradient: 'linear-gradient(135deg, #42a5f5, #478ed1)',
    },
    {
      title: 'Add Test',
      description: 'Create a new test for students',
      icon: <AssignmentIcon fontSize="large" sx={{ color: '#fff' }} />,
      path: '/add-test',
      gradient: 'linear-gradient(135deg, #66bb6a, #4caf50)',
    },
    {
      title: 'Add Admin',
      description: 'Add a new admin to the platform',
      icon: <PeopleIcon fontSize="large" sx={{ color: '#fff' }} />,
      path: '/add-admin',
      gradient: 'linear-gradient(135deg, #ff7043, #f4511e)',
    },
    {
      title: 'Create Batch',
      description: 'Create and manage student batches',
      icon: <PeopleIcon fontSize="large" sx={{ color: '#fff' }} />,
      path: '/create-batch',
      gradient: 'linear-gradient(135deg, #ffca28, #ffa000)',
    },
  ];

  return (
    <>
      <AppBar
        position="sticky"
        elevation={4}
        sx={{
          backdropFilter: 'blur(6px)',
          background: 'linear-gradient(135deg, rgba(63, 81, 181, 0.95), rgba(48, 63, 159, 0.95))',
        }}
      >
        <Toolbar
          sx={{
            px: { xs: 2, sm: 4 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 500,
              fontSize: { xs: '1rem', sm: '1.2rem' },
              whiteSpace: 'nowrap',
            }}
          >
            Admin Dashboard
          </Typography>
          <Box>
            <Tooltip title="Logout">
              <IconButton
                color="inherit"
                onClick={() => setOpenLogoutDialog(true)}
                aria-label="Logout"
                size="medium"
                sx={{ p: 1 }}
              >
                <ExitToAppIcon fontSize={isMobile ? 'small' : 'medium'} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={openLogoutDialog}
        onClose={() => setOpenLogoutDialog(false)}
        aria-labelledby="logout-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body1">
            Are you sure you want to logout?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenLogoutDialog(false)}
            color="primary"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            color="error"
            variant="contained"
            startIcon={<ExitToAppIcon />}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome, {adminName || 'Admin'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage all aspects of the learning platform
          </Typography>
          <Divider sx={{ my: 2 }} />
        </Box>

        <Grid container spacing={4}>
          {adminCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                onClick={() => navigate(card.path)}
                sx={{
                  cursor: 'pointer',
                  background: card.gradient,
                  color: '#fff',
                  '&:hover': {
                    boxShadow: 8,
                    transform: 'translateY(-6px)',
                    transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 2,
                }}
                elevation={4}
              >
                <CardContent
                  sx={{
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                  }}
                >
                  <Box
                    sx={{
                      mb: 2,
                      width: 64,
                      height: 64,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Platform Version 1.0.0 | Last updated: {new Date().toLocaleDateString()}
          </Typography>
        </Box>
      </Container>
    </>
  );
};

export default Admin;