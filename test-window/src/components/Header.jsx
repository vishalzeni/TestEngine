import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  const student = JSON.parse(localStorage.getItem('student') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('student');
    window.location.reload();
  };

  const handleLoginRedirect = () => {
    window.location.href = '/login';
  };

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
          {student ? (
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 500,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                whiteSpace: 'nowrap',
              }}
            >
              {student.firstName} {student.lastName}
            </Typography>
          ) : (
            <Box />
          )}

          {student ? (
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
          ) : (
            <Button
              color="inherit"
              onClick={handleLoginRedirect}
              variant="outlined"
              size="small"
              sx={{
                borderWidth: '2px',
                '&:hover': { borderWidth: '2px' },
              }}
            >
              Login
            </Button>
          )}
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
    </>
  );
};

export default Header;
