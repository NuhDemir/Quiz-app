import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";

const navItems = [
  {
    to: "/admin",
    label: "Quizler",
    end: true,
    icon: "🧠",
  },
];

const AdminLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <span className="admin-logo" aria-hidden="true">
            🎛️
          </span>
          <div>
            <p className="admin-title">Quiz Yönetimi</p>
            <p className="admin-subtitle">Kontrol Paneli</p>
          </div>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav__item${isActive ? " admin-nav__item--active" : ""}`
              }
            >
              <span className="admin-nav__icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Admin Paneli</h1>
            <p className="text-secondary">
              Quiz içeriklerinizi yönetin, yeni sorular ekleyin ve yayın akışını
              kontrol edin.
            </p>
          </div>
          <div className="admin-header__actions">
            <div className="admin-user-chip">
              <span className="admin-user-chip__avatar" aria-hidden="true">
                {user?.username?.[0]?.toUpperCase() || "A"}
              </span>
              <div className="admin-user-chip__info">
                <strong>{user?.username || "Admin"}</strong>
                <span>{user?.email}</span>
              </div>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={handleLogout}
            >
              Çıkış Yap
            </button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
