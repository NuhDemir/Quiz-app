import React, { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/authSlice";
import { LogoutIcon } from "./icons";

/**
 * LogoutButton
 * Sadece backend / client state temizleyerek /login'e yönlendirir.
 */
export default function LogoutButton({ variant = "button", className = "" }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = useCallback(() => {
    if (loading) return;
    setLoading(true);
    dispatch(logout());
    setLoading(false);
    navigate("/login", { replace: true });
  }, [dispatch, navigate, loading]);

  if (variant === "icon") {
    return (
      <button
        aria-label="Çıkış Yap"
        onClick={handleLogout}
        className={`p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors ${className}`}
        title="Çıkış Yap"
      >
        <LogoutIcon className="text-xl" />
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white font-semibold shadow hover:bg-red-600 transition-colors ${className}`}
    >
      <LogoutIcon /> {loading ? "Çıkış yapılıyor..." : "Çıkış Yap"}
    </button>
  );
}
