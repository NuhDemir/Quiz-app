import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { adminLogin, clearError } from "../../store/authSlice";

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth
  );

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    dispatch(clearError());
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      const redirectTo = location.state?.from || "/admin";
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location.state]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!identifier.trim() || !password.trim()) {
      setFormError("Email/kullanıcı adı ve şifre gereklidir");
      return;
    }

    try {
      await dispatch(
        adminLogin({ identifier: identifier.trim(), password, rememberMe })
      ).unwrap();
    } catch (err) {
      if (typeof err?.message === "string") {
        setFormError(err.message);
      }
    }
  };

  return (
    <div className="auth-page admin-login">
      <div className="surface-card card-content auth-card">
        <h1 className="section-heading">Admin Paneli</h1>
        <p className="text-secondary">
          Bu alana yalnızca yetkili kullanıcılar erişebilir.
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-form__field">
            <span>Email veya kullanıcı adı</span>
            <input
              type="text"
              placeholder="admin@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="auth-form__field">
            <span>Şifre</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="auth-form__remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Beni hatırla</span>
          </label>
          {(formError || error) && (
            <div className="auth-form__error">{formError || error}</div>
          )}
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Admin olarak giriş yap"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
