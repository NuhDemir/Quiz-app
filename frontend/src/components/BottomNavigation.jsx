import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Paper,
} from "@mui/material";
import {
  Home as HomeIcon,
  ViewModule as CategoriesIcon,
  TrendingUp as ProgressIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  PersonAddAlt1 as RegisterIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import LogoutButton from "./LogoutButton";
import { FiLogOut } from "react-icons/fi";

const StyledBottomNavigation = styled(MuiBottomNavigation)(() => ({
  background: "var(--bottom-nav-bg)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  borderTop: "1px solid var(--bottom-nav-border)",
  transition: "background var(--transition-base), color var(--transition-base), border-color var(--transition-base)",
  "& .MuiBottomNavigationAction-root": {
    color: "var(--bottom-nav-action)",
    transition: "color var(--transition-base)",
    "&.Mui-selected": {
      color: "var(--bottom-nav-active)",
    },
    "& .MuiBottomNavigationAction-label": {
      fontFamily: "Lexend, sans-serif",
      fontSize: "0.75rem",
      fontWeight: 500,
    },
  },
}));

const StyledPaper = styled(Paper)({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  boxShadow: "0 -2px 20px rgba(0, 0, 0, 0.1)",
});

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const navItems = isAuthenticated
    ? [
        { path: "/", icon: <HomeIcon />, label: "Ana Sayfa" },
        { path: "/categories", icon: <CategoriesIcon />, label: "Kategoriler" },
        { path: "/leaderboard", icon: <ProgressIcon />, label: "İlerleme" },
        { path: "/profile", icon: <ProfileIcon />, label: "Profil" },
        { path: "/settings", icon: <SettingsIcon />, label: "Ayarlar" },
        { path: "__logout__", icon: <FiLogOut />, label: "Çıkış" },
      ]
    : [
        { path: "/", icon: <HomeIcon />, label: "Ana Sayfa" },
        { path: "/categories", icon: <CategoriesIcon />, label: "Kategoriler" },
        { path: "/leaderboard", icon: <ProgressIcon />, label: "İlerleme" },
        { path: "/login", icon: <LoginIcon />, label: "Giriş" },
        { path: "/register", icon: <RegisterIcon />, label: "Kayıt" },
      ];

  const handleNavigationChange = (event, newValue) => {
    const target = navItems[newValue];
    if (!target) return;
    if (target.path === "__logout__") {
      // Trigger logout imperatively
      const evt = new Event("app:logout");
      window.dispatchEvent(evt);
      return;
    }
    navigate(target.path);
  };

  const currentIndex = navItems.findIndex(
    (item) => item.path === location.pathname
  );

  return (
    <StyledPaper elevation={8}>
      <StyledBottomNavigation
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={handleNavigationChange}
        showLabels
      >
        {navItems.map((item) => {
          // For logout use simple action icon
          return (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
            />
          );
        })}
      </StyledBottomNavigation>
    </StyledPaper>
  );
};

export default BottomNavigation;
