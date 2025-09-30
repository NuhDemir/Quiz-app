import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser, clearError } from "../store/authSlice";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState(null);

  // Animasyonlar kaldırıldı – sade render.

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  const handleIdentifierChange = (event) => {
    setIdentifier(event.target.value);
    setFormError(null);
    if (error) {
      dispatch(clearError());
    }
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setFormError(null);
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!identifier.trim() || !password) {
      setFormError("Lütfen e-posta/kullanıcı adı ve şifrenizi girin.");
      return;
    }

    dispatch(
      loginUser({
        identifier: identifier.trim(),
        password,
      })
    );
  };

  return (
    <div
      className="auth-page"
      style={{ width: "100%", alignContent: "center" }}
    >
      <section className="auth-hero">
        <h1>Quiz macerana hemen dön!</h1>
        <p>
          Hesabına giriş yaparak ilerlemeni takip et, rozetler kazan ve
          hedeflerine odaklan.
        </p>
      </section>
      <section className="surface-card card-content auth-card">
        <>
          <header className="auth-card__header">
            <h2>Giriş Yap</h2>
            <p>Hoş geldin! Seni tekrar görmek harika.</p>
          </header>
          {(formError || error) && (
            <div className="auth-alert auth-alert--error">
              {formError || error}
            </div>
          )}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field">
              <span className="auth-field__label">
                E-posta veya kullanıcı adı
              </span>
              <input
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="ornek@domain.com"
                value={identifier}
                onChange={handleIdentifierChange}
              />
            </label>
            <label className="auth-field">
              <span className="auth-field__label">Şifre</span>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
              />
            </label>
            <button
              type="submit"
              className="primary-button auth-submit"
              disabled={loading}
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
            {/* Şifre sıfırlama özelliği kaldırıldı */}
            <footer className="auth-card__footer">
              <p>
                Hesabın yok mu? <Link to="/register">Hemen kayıt ol</Link>
              </p>
            </footer>
          </form>
        </>
      </section>
    </div>
  );
};

export default Login;
