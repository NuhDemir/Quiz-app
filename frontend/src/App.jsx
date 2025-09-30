import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
// Şifre sıfırlama ve email doğrulama sayfaları kaldırıldı
import BottomNavigation from "./components/BottomNavigation";
import WelcomeScreen from "./components/WelcomeScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import useGsapAnimations from "./hooks/useGsapAnimations";
import { fetchCurrentUser } from "./store/authSlice";

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { timeline } = useGsapAnimations();
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem("hasVisited");
    if (hasVisited) {
      setShowWelcome(false);
    }

    // Check dark mode preference
    const darkModePreference = localStorage.getItem("darkMode");
    if (darkModePreference === "true") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    // GSAP initial animation
    const introTl = timeline();
    introTl.fromTo(
      ".app-container",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    );

    return () => {
      introTl.kill();
    };
  }, [timeline]);

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token]);

  const handleWelcomeComplete = () => {
    localStorage.setItem("hasVisited", "true");

    // Animate welcome screen exit
    const exitTl = timeline({ onComplete: () => setShowWelcome(false) });
    exitTl.to(".welcome-screen", {
      opacity: 0,
      scale: 0.8,
      duration: 0.6,
      ease: "power2.inOut",
    });
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());

    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  return (
    <div className={`app-container ${darkMode ? "dark" : ""}`}>
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <Home darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            }
          />
          <Route path="/categories" element={<Categories />} />
          <Route path="/quiz/:category" element={<Quiz />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Forgot / Reset / Verify routes removed */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route
              path="/settings"
              element={
                <Settings darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              }
            />
          </Route>
        </Routes>
      </main>
      <BottomNavigation />
    </div>
  );
}

export default App;
