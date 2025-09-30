import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  LinearProgress,
  Chip,
  Stack,
  Button,
} from "@mui/material";
import {
  ArrowBackIosNewRounded,
  AutoAwesomeRounded,
  ChevronRightRounded,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import useGsapAnimations from "../hooks/useGsapAnimations";
import categories from "../data/categories.json";
import levels from "../data/levels.json";

const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  backgroundColor: theme.palette.mode === "dark" ? "#0b0d15" : "#f5f5f7",
  padding: theme.spacing(5, 3, 12),
  transition: "background-color 0.3s ease",
}));

const ContentWrapper = styled(Box)(() => ({
  maxWidth: 960,
  margin: "0 auto",
  width: "100%",
}));

const SurfaceCard = styled(Card)(({ theme }) => ({
  borderRadius: 22,
  backgroundColor:
    theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.75)" : "#ffffff",
  border: `1px solid ${
    theme.palette.mode === "dark"
      ? "rgba(255,255,255,0.08)"
      : "rgba(15,23,42,0.05)"
  }`,
  boxShadow:
    theme.palette.mode === "dark"
      ? "0 32px 60px rgba(0, 0, 0, 0.45)"
      : "0 32px 80px rgba(15, 23, 42, 0.08)",
  backdropFilter: theme.palette.mode === "dark" ? "blur(18px)" : "none",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
}));

const CategoryCard = styled(SurfaceCard)(({ theme }) => ({
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 30px 60px rgba(0, 0, 0, 0.4)"
        : "0 36px 70px rgba(15, 23, 42, 0.12)",
  },
}));

const LevelCard = styled(SurfaceCard)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(2.5),
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
  fontFamily: "Lexend, sans-serif",
  fontWeight: 600,
  color: theme.palette.mode === "dark" ? "#f5f5f7" : "#1f2937",
}));

const Categories = () => {
  const navigate = useNavigate();
  const { stats } = useSelector((state) => state.user);
  const headerRef = useRef();
  const categoriesRef = useRef();
  const levelsRef = useRef();
  const { slideUp, staggerList } = useGsapAnimations();

  useEffect(() => {
    const headerAnimation = slideUp(headerRef.current, {
      offset: 30,
      duration: 0.8,
      ease: "power3.out",
    });

    const categoryAnimation = staggerList(
      categoriesRef.current?.children || [],
      {
        offset: 20,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
      }
    );

    const levelAnimation = staggerList(levelsRef.current?.children || [], {
      from: { scale: 0.92 },
      to: { scale: 1 },
      duration: 0.5,
      stagger: 0.1,
      ease: "power3.out",
    });

    return () => {
      headerAnimation?.kill?.();
      categoryAnimation?.kill?.();
      levelAnimation?.kill?.();
    };
  }, [slideUp, staggerList]);

  const handleCategorySelect = (categoryId) => {
    navigate(`/quiz/${categoryId}`);
  };

  const getCategoryProgress = (categoryId) => {
    return stats.categoryStats?.[categoryId]?.accuracy || 0;
  };

  return (
    <PageContainer>
      <ContentWrapper>
        <SurfaceCard elevation={0} sx={{ mb: 5 }}>
          <CardContent ref={headerRef} sx={{ p: { xs: 3, md: 4 } }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              spacing={2}
            >
              <Box>
                <SectionHeading variant="h4" sx={{ fontWeight: 700 }}>
                  Kategoriler
                </SectionHeading>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 1,
                    color: "rgba(55,65,81,0.65)",
                    fontFamily: "Lexend, sans-serif",
                    ...(stats?.totalQuizzes && stats.totalQuizzes > 0
                      ? { display: "block" }
                      : {}),
                  }}
                >
                  Kendinize uygun kategori ile çalışmaya başlayın.
                </Typography>
              </Box>
              <IconButton
                onClick={() => navigate("/")}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "#f1f2f6",
                  color: "#1f2937",
                  "&:hover": { backgroundColor: "#e5e7eb" },
                }}
              >
                <ArrowBackIosNewRounded fontSize="small" />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              <Chip
                icon={<AutoAwesomeRounded fontSize="small" />}
                label="Önerilen"
                sx={{
                  borderRadius: 3,
                  backgroundColor: "rgba(0,119,255,0.08)",
                  color: "#0077FF",
                  fontWeight: 600,
                  fontFamily: "Lexend, sans-serif",
                  paddingX: 1,
                }}
              />
              <Chip
                label={`Toplam ${categories.length} kategori`}
                sx={{
                  borderRadius: 3,
                  backgroundColor: "rgba(15,23,42,0.05)",
                  color: "rgba(17,24,39,0.7)",
                  fontFamily: "Lexend, sans-serif",
                }}
              />
            </Stack>
          </CardContent>
        </SurfaceCard>

        <Box sx={{ mb: 6 }}>
          <SectionHeading variant="h6" sx={{ mb: 3 }}>
            Tüm kategoriler
          </SectionHeading>
          <Grid container spacing={2.5} ref={categoriesRef}>
            {categories.map((category) => {
              const progress = getCategoryProgress(category.id);

              return (
                <Grid item xs={12} md={6} key={category.id}>
                  <CategoryCard
                    elevation={0}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <CardContent sx={{ p: { xs: 3, md: 3.5 } }}>
                      <Stack direction="row" alignItems="center" spacing={2.5}>
                        <Box
                          sx={{
                            width: 72,
                            height: 72,
                            borderRadius: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 32,
                            backgroundColor: `${category.color}15`,
                          }}
                        >
                          {category.icon}
                        </Box>
                        <Stack flex={1} spacing={1}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: "Lexend, sans-serif",
                              fontWeight: 600,
                              color: "#1f2937",
                            }}
                          >
                            {category.nameTr}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: "rgba(55,65,81,0.6)" }}
                          >
                            {category.descriptionTr}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Chip
                              label={`${category.totalQuestions} soru`}
                              size="small"
                              sx={{
                                backgroundColor: "rgba(15,23,42,0.05)",
                                color: "rgba(17,24,39,0.7)",
                                borderRadius: 2,
                                fontFamily: "Lexend, sans-serif",
                              }}
                            />
                            {progress > 0 && (
                              <Chip
                                label={`%${Math.round(progress)} tamamlandı`}
                                size="small"
                                sx={{
                                  backgroundColor: `${category.color}15`,
                                  color: category.color,
                                  borderRadius: 2,
                                  fontWeight: 600,
                                  fontFamily: "Lexend, sans-serif",
                                }}
                              />
                            )}
                          </Stack>
                        </Stack>
                        <ChevronRightRounded
                          sx={{ color: "rgba(55,65,81,0.4)" }}
                        />
                      </Stack>

                      <Box sx={{ mt: 3 }}>
                        <LinearProgress
                          variant="determinate"
                          value={progress}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "rgba(15,23,42,0.08)",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 4,
                              backgroundColor: category.color,
                            },
                          }}
                        />
                      </Box>
                    </CardContent>
                  </CategoryCard>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        <SectionHeading variant="h6" sx={{ mb: 3 }}>
          Zorluk seviyeleri
        </SectionHeading>
        <Grid container spacing={2.5} ref={levelsRef}>
          {levels.map((level) => (
            <Grid item xs={6} md={3} key={level.id}>
              <LevelCard elevation={0}>
                <Stack spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      backgroundColor: `${level.color}18`,
                      color: level.color,
                    }}
                  >
                    {level.icon || "🎯"}
                  </Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#1f2937" }}
                  >
                    {level.id}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(55,65,81,0.6)",
                      fontFamily: "Lexend, sans-serif",
                    }}
                  >
                    {level.nameTr}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(55,65,81,0.5)" }}
                  >
                    {level.descriptionTr}
                  </Typography>
                </Stack>
              </LevelCard>
            </Grid>
          ))}
        </Grid>

        <SurfaceCard elevation={0} sx={{ mt: 6 }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2.5}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <SectionHeading variant="h6">
                  Nasıl ilerlemek istersiniz?
                </SectionHeading>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(55,65,81,0.6)", mt: 0.5 }}
                >
                  Tekrar etmek veya yeni konular keşfetmek için kategorinizi
                  seçin.
                </Typography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                width={{ xs: "100%", sm: "auto" }}
              >
                <Button
                  variant="contained"
                  onClick={() => navigate("/quiz/grammar")}
                  sx={{
                    backgroundColor: "#0077FF",
                    borderRadius: 3,
                    paddingX: 3,
                    fontFamily: "Lexend, sans-serif",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#0061cc" },
                  }}
                >
                  En popüler quiz
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/")}
                  sx={{
                    borderRadius: 3,
                    paddingX: 3,
                    borderColor: "rgba(15,23,42,0.15)",
                    color: "#1f2937",
                    fontFamily: "Lexend, sans-serif",
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "rgba(15,23,42,0.25)",
                      backgroundColor: "rgba(15,23,42,0.04)",
                    },
                  }}
                >
                  Ana sayfaya dön
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </SurfaceCard>
      </ContentWrapper>
    </PageContainer>
  );
};

export default Categories;
