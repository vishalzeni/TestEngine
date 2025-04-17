import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';
import { styled } from '@mui/system';

// Styled 3D Card Component
const StudentCard = styled(motion.div)(({ theme }) => ({
  width: '100%',
  maxWidth: '480px',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 245, 255, 0.9) 100%)',
  backdropFilter: 'blur(15px)',
  borderRadius: '30px',
  padding: '40px',
  boxShadow: '0 12px 50px rgba(0, 0, 0, 0.2), inset 0 2px 8px rgba(255, 255, 255, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  zIndex: 2,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.3), transparent 70%)',
    opacity: 0.5,
    zIndex: -1,
  },
  [theme.breakpoints.down('sm')]: {
    padding: '28px',
    maxWidth: '92%',
  },
}));

// Custom Knowledge Icon
const KnowledgeIcon = () => (
  <motion.div
    className="knowledge-icon"
    animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
    aria-hidden="true"
  >
    <svg width="90" height="90" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" fill="#6b48ff" fillOpacity="0.2" />
      <path
        d="M32 12C42.4934 12 51 20.5066 51 31C51 41.4934 42.4934 50 32 50C21.5066 50 13 41.4934 13 31C13 20.5066 21.5066 12 32 12Z"
        stroke="#6b48ff"
        strokeWidth="2"
      />
      <path
        d="M32 20V32L40 38"
        stroke="#6b48ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 8V12M40 8V12M20 24H12M52 24H44"
        stroke="#6b48ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="32" cy="32" r="4" fill="#00ddeb" />
    </svg>
  </motion.div>
);

const RoleSelection = () => {
  const navigate = useNavigate();
  const controls = useAnimation();
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    });
  }, [controls]);

  const handleStudentClick = () => {
    setIsStarting(true);
    setTimeout(() => {
      navigate('/student-login');
    }, 800); // Matches the animation duration
  };

  const handleAdminClick = () => navigate('/admin-login');

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(-45deg, #3f51b5, rgb(60, 122, 188), rgb(212, 149, 255), #48dbfb)',
        backgroundSize: '400% 400%',
        animation: 'gradient 12s ease infinite',
        position: 'relative',
        overflow: 'hidden',
      }}
      className="gradient-bg"
    >
      {/* Animated Background Bubbles */}
      <motion.div
        className="bubble bubble-1"
        animate={{ y: [0, -80, 0], x: [0, 40, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <motion.div
        className="bubble bubble-2"
        animate={{ y: [0, -120, 0], x: [0, -60, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />

      {/* Page Transition Overlay */}
      {isStarting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.9)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
              textAlign: 'center',
              padding: '2rem',
              borderRadius: '1rem',
            }}
          >
            <motion.div
              animate={{
                rotate: 360,
                transition: { duration: 1.5, repeat: Infinity, ease: 'linear' }
              }}
              style={{
                width: 60,
                height: 60,
                margin: '0 auto 1rem',
                border: '3px solid #6b48ff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
              }}
            />
            <Typography variant="h6" sx={{ color: '#6b48ff', fontWeight: 600 }}>
              Login in Progress...
            </Typography>
          </motion.div>
        </motion.div>
      )}

      <StudentCard
        initial={{ opacity: 0, y: 40 }}
        animate={controls}
        transition={{ type: 'spring', stiffness: 120 }}
        role="region"
        aria-labelledby="student-portal-title"
      >
        <KnowledgeIcon />

        <Typography
          id="student-portal-title"
          variant="h4"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #6b48ff, #00ddeb)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
          }}
        >
          Welcome to Test Window
        </Typography>

        <Typography variant="subtitle1" sx={{ mb: 3, color: '#555', fontWeight: 400 }}>
          Here you can take your tests and track your progress.
        </Typography>

        <motion.div 
          whileHover={{ scale: 1.03 }} 
          whileTap={{ scale: 0.98 }}
          style={{ display: 'inline-block' }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleStudentClick}
            disabled={isStarting}
            sx={{
              py: 1.5,
              px: 5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '12px',
              background: 'linear-gradient(45deg, #6b48ff, #00ddeb)',
              boxShadow: '0 4px 12px rgba(107, 72, 255, 0.3)',
              mb: 2,
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(107, 72, 255, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
                transform: 'translateX(-100%)',
              },
              '&:hover::after': {
                animation: 'shimmer 1.5s infinite',
              },
            }}
            aria-label="Let's Start"
          >
            {isStarting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <motion.span
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    transition: { duration: 1.5, repeat: Infinity }
                  }}
                >
                  Loading...
                </motion.span>
              </Box>
            ) : (
              "Let's Start"
            )}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.04 }}>
          <Button
            variant="text"
            size="small"
            onClick={handleAdminClick}
            sx={{
              color: '#666',
              fontWeight: 500,
              textDecoration: 'underline',
              '&:hover': {
                color: '#6b48ff',
              },
            }}
            aria-label="Administrator Access"
          >
            Administrator Access
          </Button>
        </motion.div>
      </StudentCard>

      <style jsx>{`
        .gradient-bg {
          background-size: 400% 400%;
          animation: gradient 12s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .bubble {
          position: absolute;
          border-radius: '50%';
          background: rgba(255, 255, 255, 0.15);
          backdropFilter: blur(6px);
          zIndex: 1;
        }
        .bubble-1 {
          width: 250px;
          height: 250px;
          top: -40px;
          left: -40px;
        }
        .bubble-2 {
          width: 180px;
          height: 180px;
          bottom: -20px;
          right: -20px;
        }
        .knowledge-icon {
          margin: 0 auto 20px;
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.15));
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </Box>
  );
};

export default RoleSelection;