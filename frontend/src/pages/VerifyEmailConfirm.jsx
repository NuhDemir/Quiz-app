import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import apiRequest from "../utils/apiClient";

export default function VerifyEmailConfirm() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const token = search.get("token") || "";
  const [status, setStatus] = useState("pending"); // pending | success | error | expired | already
  const [message, setMessage] = useState("Doğrulama yapılıyor...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token bulunamadı.");
      return;
    }
    (async () => {
      try {
        const res = await apiRequest("auth-verify-email", {
          method: "POST",
          data: { token },
        });
        if (res.alreadyVerified) {
          setStatus("already");
          setMessage("E-posta zaten doğrulanmış.");
          setTimeout(() => navigate("/login"), 1500);
        } else if (res.verified) {
          setStatus("success");
          setMessage(
            "E-posta başarıyla doğrulandı! Giriş sayfasına yönlendiriliyorsun."
          );
          setTimeout(() => navigate("/login"), 1500);
        } else {
          setStatus("error");
          setMessage("Beklenmeyen yanıt.");
        }
      } catch (err) {
        const msg = err.message || "Doğrulama başarısız";
        if (/expired/i.test(msg)) setStatus("expired");
        else setStatus("error");
        setMessage(msg);
      }
    })();
  }, [token, navigate]);

  return (
    <div className="auth-page">
      <section className="auth-hero">
        <h1>E-posta Doğrulama</h1>
        <p>Hesabının güvenliği için doğrulama gerekli.</p>
      </section>
      <section className="surface-card card-content auth-card">
        <header className="auth-card__header">
          <h2>Durum</h2>
          <p>{message}</p>
        </header>
        {status === "expired" && (
          <div className="auth-card__footer">
            <p>
              Token süresi dolmuş olabilir.{" "}
              <Link to="/verify-email">Yeniden gönder</Link>
            </p>
          </div>
        )}
        {status === "error" && (
          <div className="auth-card__footer">
            <p>
              Bir hata oluştu. <Link to="/verify-email">Tekrar dene</Link>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
