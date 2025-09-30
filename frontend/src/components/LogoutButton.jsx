import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { FiLogOut } from "react-icons/fi";

/**
 * LogoutButton
 * Sadece backend / client state temizleyerek /login'e yönlendirir.
 */
export default function LogoutButton({ variant = "button", className = "" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Sadece lokal oturumu kapat.
    } catch (e) {
      console.warn("[Logout] logout sırasında hata:", e);
    } finally {
      dispatch(logout());
      setLoading(false);
      navigate("/login", { replace: true });
    }
  };

  if (variant === "icon") {
    return (
      <button
        aria-label="Çıkış Yap"
        onClick={handleLogout}
        className={`p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors ${className}`}
        title="Çıkış Yap"
      >
        <FiLogOut className="text-xl" />
      </button>
    );
  }

  // Global event listener (used by BottomNavigation logout icon)
  React.useEffect(() => {
    const listener = () => handleLogout();
    window.addEventListener("app:logout", listener);
    return () => window.removeEventListener("app:logout", listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition-colors ${className}`}
    >
      <FiLogOut /> {loading ? "Çıkış yapılıyor..." : "Çıkış Yap"}
    </button>
  );
}
