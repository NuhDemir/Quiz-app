import React, { useState } from "react";
import apiRequest from "../utils/apiClient";
import { useSearchParams, Link, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialToken = searchParams.get("token") || "";
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [message, setMessage] = useState(null);
  // Animasyonlar kaldırıldı – sade render.

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim() || password.length < 8 || password !== confirm) {
      setMessage("Token ve şifre koşullarını sağlayın (>=8 ve eşleşmeli).");
      return;
    }
    setStatus("submitting");
    setMessage(null);
    try {
      const res = await apiRequest("auth-password-reset", {
        method: "POST",
        data: { token, password },
      });
      setStatus("success");
      setMessage(res.message || "Parola güncellendi.");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "İşlem başarısız oldu");
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <h1>Yeni Parolanı Oluştur</h1>
        <p>Güçlü bir parola seç ve hesabını güvene al.</p>
      </section>
      <section className="surface-card card-content auth-card">
        <header className="auth-card__header">
          <h2>Parola Yenile</h2>
          <p>Reset token ve yeni parolanı gir.</p>
        </header>
        {message && (
          <div
            className={`auth-alert ${
              status === "error" ? "auth-alert--error" : ""
            }`}
          >
            {message}
          </div>
        )}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-field">
            <span className="auth-field__label">Reset Token</span>
            <input
              type="text"
              placeholder="E-postadaki token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </label>
          <label className="auth-field">
            <span className="auth-field__label">Yeni Şifre</span>
            <input
              type="password"
              placeholder="En az 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="auth-field">
            <span className="auth-field__label">Yeni Şifre (Tekrar)</span>
            <input
              type="password"
              placeholder="Şifreyi tekrar yaz"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? "Gönderiliyor..." : "Parolayı Güncelle"}
          </button>
          <footer className="auth-card__footer">
            <p>
              Geri dön <Link to="/login">Giriş Yap</Link>
            </p>
          </footer>
        </form>
      </section>
    </div>
  );
}
