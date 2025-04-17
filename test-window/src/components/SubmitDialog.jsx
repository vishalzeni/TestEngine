import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SubmitDialog = ({ open, onClose, onConfirm, fetchResults }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleConfirm = async () => {
    onConfirm();
    const { test, answers, progress } = await fetchResults(); // Fetch the test, answers, and progress data
    const attempted = Object.values(progress).reduce(
      (sum, section) => sum + section.filter((q) => q).length,
      0
    );
    const total = test.sections.reduce(
      (sum, section) => sum + (section.questions?.length || 0),
      0
    );
    navigate('/result', { state: { test, answers, progress, attempted, total } });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="submit-dialog-title"
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: 24,
        },
      }}
    >
      <DialogTitle
        id="submit-dialog-title"
        sx={{
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.common.white,
          fontWeight: 700,
          py: 2,
          textAlign: 'center',
        }}
      >
        Confirm Submission
      </DialogTitle>
      <DialogContent sx={{ py: 2 }}>
        <Typography
          variant="body1"
          sx={{
            textAlign: 'center',
            fontSize: '1rem',
            marginTop: 3,
            color: theme.palette.text.secondary,
          }}
        >
          Are you sure you want to submit the test? You won't be able to make changes after submission.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pt: 2, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{
            minWidth: 120,
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="success"
          sx={{
            minWidth: 120,
            px: 3,
            py: 1,
            borderRadius: 2,
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitDialog;