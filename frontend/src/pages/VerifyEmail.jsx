import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import apiRequest from "../utils/apiClient";

export default function VerifyEmail() {
  const { user } = useSelector((s) => s.auth);
  const [email, setEmail] = useState(user?.email || "");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [message, setMessage] = useState(null);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setMessage(null);
    try {
      const res = await apiRequest("auth-resend-verification", {
        method: "POST",
        data: { email },
      });
      setStatus("sent");
      setMessage(
        res.message || "Eğer e-posta sistemde varsa doğrulama maili gönderildi."
      );
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "İstek başarısız");
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <h1>E-postanı Doğrula</h1>
        <p>
          Hesabını aktif etmek için e-posta kutunu kontrol et. Spam klasörüne
          düşmüş olabilir.
        </p>
      </section>
      <section className="surface-card card-content auth-card">
        <header className="auth-card__header">
          <h2>Doğrulama Gerekli</h2>
          <p>
            {user?.email ? `${user.email} adresine` : "E-postana"} doğrulama
            bağlantısı gönderildi.
          </p>
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
        <form className="auth-form" onSubmit={handleResend} noValidate>
          <label className="auth-field">
            <span className="auth-field__label">E-posta</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@domain.com"
            />
          </label>
          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Gönderiliyor..." : "Tekrar Gönder"}
          </button>
          <footer className="auth-card__footer">
            <p>
              <Link to="/login">Giriş sayfasına dön</Link>
            </p>
          </footer>
        </form>
      </section>
    </div>
  );
}
