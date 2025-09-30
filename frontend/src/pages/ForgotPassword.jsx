import React, { useState } from "react";
import apiRequest from "../utils/apiClient";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [message, setMessage] = useState(null);
  const [devToken, setDevToken] = useState(null);
  // Animasyon kaldırıldı – sade render.

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setMessage(null);
    setDevToken(null);
    try {
      const res = await apiRequest("auth-password-reset-request", {
        method: "POST",
        data: { email },
      });
      setStatus("sent");
      setMessage(
        res.message ||
          "Eğer e-posta kayıtlıysa sıfırlama bağlantısı gönderildi. Lütfen gelen kutunu (ve spam klasörünü) kontrol et."
      );
      if (res.devResetToken && import.meta.env.MODE !== "production")
        setDevToken(res.devResetToken);
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "İstek başarısız oldu");
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <h1>Şifreni mi Unuttun?</h1>
        <p>
          Kayıtlı e-posta adresini gir; eğer sistemde varsa reset bağlantısı
          alacaksın.
        </p>
      </section>
      <section className="surface-card card-content auth-card">
        <header className="auth-card__header">
          <h2>Parola Sıfırlama</h2>
          <p>E-posta adresini yaz ve gönder.</p>
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
            <span className="auth-field__label">E-posta</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="ornek@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Gönderiliyor..." : "Gönder"}
          </button>
          <footer className="auth-card__footer">
            <p>
              Giriş ekranına dön <Link to="/login">Giriş Yap</Link>
            </p>
          </footer>
        </form>
        {devToken && (
          <div className="auth-alert" style={{ marginTop: "0.5rem" }}>
            Geliştirici Token (DEV): <code>{devToken}</code>
          </div>
        )}
      </section>
    </div>
  );
}
