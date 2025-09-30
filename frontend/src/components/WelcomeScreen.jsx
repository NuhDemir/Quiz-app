import React, { useEffect, useRef } from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import { styled } from "@mui/material/styles";
import useGsapAnimations from "../hooks/useGsapAnimations";

const StyledContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3),
  textAlign: "center",
  position: "relative",
  overflow: "hidden",
}));

const BackgroundDecoration = styled(Box)({
  position: "absolute",
  inset: 0,
  opacity: 0.1,
  "& .floating-element": {
    position: "absolute",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.3)",
    filter: "blur(20px)",
    animation: "pulse 2s ease-in-out infinite",
  },
  "& .element-1": {
    top: "80px",
    left: "40px",
    width: "128px",
    height: "128px",
  },
  "& .element-2": {
    bottom: "80px",
    right: "40px",
    width: "160px",
    height: "160px",
    animationDelay: "1s",
  },
  "& .element-3": {
    top: "50%",
    left: "25%",
    width: "96px",
    height: "96px",
    animationDelay: "0.5s",
  },
  "@keyframes pulse": {
    "0%, 100%": {
      opacity: 0.1,
      transform: "scale(1)",
    },
    "50%": {
      opacity: 0.3,
      transform: "scale(1.1)",
    },
  },
});

const AppIcon = styled(Box)(({ theme }) => ({
  width: 96,
  height: 96,
  margin: "0 auto 16px",
  background: "#667eea",
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2.5rem",
  boxShadow: theme.shadows[8],
}));

const GlassCard = styled(Card)(() => ({
  background: "rgba(255, 255, 255, 0.25)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
  maxWidth: 400,
  width: "100%",
  position: "relative",
  zIndex: 10,
}));

const StyledButton = styled(Button)(() => ({
  background: "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
  border: 0,
  borderRadius: 12,
  boxShadow: "0 3px 5px 2px rgba(102, 126, 234, .3)",
  color: "white",
  height: 56,
  padding: "0 24px",
  fontSize: "1.1rem",
  fontWeight: "bold",
  textTransform: "none",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(102, 126, 234, .4)",
  },
  "&:active": {
    transform: "scale(0.98)",
  },
}));

const WelcomeScreen = ({ onComplete }) => {
  const containerRef = useRef();
  const iconRef = useRef();
  const titleRef = useRef();
  const subtitleRef = useRef();
  const descriptionRef = useRef();
  const buttonRef = useRef();
  const floatAnimationRef = useRef();
  const { fadeIn, staggerList, float, timeline } = useGsapAnimations();

  useEffect(() => {
    const containerAnimation = fadeIn(containerRef.current, {
      from: { opacity: 0, scale: 0.95 },
      to: { scale: 1, duration: 0.8, ease: "power2.out" },
    });

    const iconAnimation = fadeIn(iconRef.current, {
      from: { y: 50, scale: 0.9 },
      to: { y: 0, duration: 1, ease: "power3.out" },
    });

    const sequenceAnimations = staggerList(
      [
        titleRef.current,
        subtitleRef.current,
        descriptionRef.current,
        buttonRef.current,
      ].filter(Boolean),
      {
        offset: 30,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        from: { y: 30 },
      }
    );

    floatAnimationRef.current = float(iconRef.current, {
      y: -10,
      duration: 2,
      ease: "power1.inOut",
    });

    return () => {
      containerAnimation?.kill?.();
      iconAnimation?.kill?.();
      sequenceAnimations?.kill?.();
      floatAnimationRef.current?.kill?.();
    };
  }, [fadeIn, staggerList, float]);

  const handleGetStarted = () => {
    floatAnimationRef.current?.kill?.();

    const exitTimeline = timeline({ onComplete });

    exitTimeline
      .to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      })
      .to(
        [
          iconRef.current,
          titleRef.current,
          subtitleRef.current,
          descriptionRef.current,
          buttonRef.current,
        ],
        {
          opacity: 0,
          y: -30,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.in",
        }
      )
      .to(
        containerRef.current,
        {
          opacity: 0,
          scale: 0.9,
          duration: 0.6,
          ease: "power2.inOut",
        },
        "-=0.2"
      );
  };

  return (
    <StyledContainer ref={containerRef} className="welcome-screen">
      {/* Background decoration */}
      <BackgroundDecoration>
        <div className="floating-element element-1"></div>
        <div className="floating-element element-2"></div>
        <div className="floating-element element-3"></div>
      </BackgroundDecoration>

      <GlassCard elevation={0}>
        <CardContent sx={{ p: 4 }}>
          {/* App Icon/Logo */}
          <Box ref={iconRef} sx={{ mb: 3 }}>
            <AppIcon>🎯</AppIcon>
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: "bold",
                color: "white",
                fontFamily: "Lexend, sans-serif",
              }}
            >
              English Quiz Master
            </Typography>
          </Box>

          {/* Welcome text */}
          <Box ref={titleRef} sx={{ mb: 2 }}>
            <Typography
              variant="h3"
              component="h2"
              sx={{
                fontWeight: "bold",
                color: "white",
                fontSize: { xs: "2rem", sm: "2.5rem" },
                fontFamily: "Lexend, sans-serif",
              }}
            >
              Test Your English
            </Typography>
          </Box>

          <Box ref={subtitleRef} sx={{ mb: 4 }}>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "1.1rem",
                lineHeight: 1.6,
                fontFamily: "Lexend, sans-serif",
              }}
            >
              Improve your English skills with fun and engaging quizzes. Choose
              a new quiz or review your past performance.
            </Typography>
          </Box>

          {/* Get Started Button */}
          <Box ref={descriptionRef} sx={{ mb: 2 }}>
            <StyledButton
              variant="contained"
              size="large"
              fullWidth
              onClick={handleGetStarted}
            >
              Get Started
            </StyledButton>
          </Box>

          {/* Skip option */}
          <Box ref={buttonRef}>
            <Button
              onClick={onComplete}
              sx={{
                color: "rgba(255, 255, 255, 0.7)",
                "&:hover": {
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
                textTransform: "none",
                fontFamily: "Lexend, sans-serif",
              }}
            >
              Skip Introduction
            </Button>
          </Box>
        </CardContent>
      </GlassCard>
    </StyledContainer>
  );
};

export default WelcomeScreen;
