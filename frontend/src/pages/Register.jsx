import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, clearError } from "../store/authSlice";

const initialForm = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [formValues, setFormValues] = useState(initialForm);
  const [formError, setFormError] = useState(null);

  // Animasyonlar kaldırıldı – sade render.

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    if (formError) {
      setFormError(null);
    }

    if (error) {
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    if (formValues.username.trim().length < 3) {
      return "Kullanıcı adı en az 3 karakter olmalı";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      return "Geçerli bir e-posta adresi girin";
    }

    if (formValues.password.length < 8) {
      return "Şifreniz en az 8 karakter olmalıdır";
    }

    if (formValues.password !== formValues.confirmPassword) {
      return "Şifreler birbiriyle eşleşmiyor";
    }

    return null;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    dispatch(
      registerUser({
        username: formValues.username.trim(),
        email: formValues.email.trim().toLowerCase(),
        password: formValues.password,
      })
    );
  };

  return (
    <div className="auth-page auth-page--accent">
      <section className="auth-hero">
        <div className="auth-badge">🎉</div>
        <h1>Quiz dünyasına katıl!</h1>
        <p>
          Kendine özel quiz önerileri al, hedefler belirle ve arkadaşlarınla
          rekabet et.
        </p>
      </section>
      <section className="surface-card card-content auth-card">
        <header className="auth-card__header">
          <h2>Hesap Oluştur</h2>
          <p>
            Kaydolduğunda ilerlemelerin, rozetlerin ve daha fazlası seninle
            olur.
          </p>
        </header>

        {(formError || error) && (
          <div className="auth-alert auth-alert--error">
            {formError || error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="auth-field">
            <span className="auth-field__label">Kullanıcı adı</span>
            <input
              name="username"
              type="text"
              autoComplete="nickname"
              placeholder="quizmaster"
              value={formValues.username}
              onChange={handleChange}
            />
          </label>

          <label className="auth-field">
            <span className="auth-field__label">E-posta</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ornek@domain.com"
              value={formValues.email}
              onChange={handleChange}
            />
          </label>

          <label className="auth-field">
            <span className="auth-field__label">Şifre</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="En az 8 karakter"
              value={formValues.password}
              onChange={handleChange}
            />
          </label>

          <label className="auth-field">
            <span className="auth-field__label">Şifre (tekrar)</span>
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Şifrenizi tekrar girin"
              value={formValues.confirmPassword}
              onChange={handleChange}
            />
          </label>

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? "Kaydediliyor..." : "Kaydol"}
          </button>
        </form>

        <footer className="auth-card__footer">
          <p>
            Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
          </p>
        </footer>
      </section>
    </div>
  );
};

export default Register;
