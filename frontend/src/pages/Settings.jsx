import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  HiMoon,
  HiSun,
  HiTranslate,
  HiVolumeUp,
  HiBell,
  HiRefresh,
  HiTrash,
  HiInformationCircle,
} from "react-icons/hi";
import { resetStats, updatePreferences } from "../store/userSlice";
import { useSelector } from "react-redux";
import apiRequest from "../utils/apiClient";
import LogoutButton from "../components/LogoutButton";

const Settings = ({ darkMode, toggleDarkMode }) => {
  // Settings state
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const auth = useSelector((s) => s.auth);
  const reduxPrefs = useSelector((s) => s.user.preferences);
  const [settings, setSettings] = useState({
    notifications: reduxPrefs.notifications ?? false,
    sound: false,
    language: reduxPrefs.language || "tr",
    theme: darkMode ? "dark" : "light",
  });
  // loading: initial fetch loading state
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const saveTimeoutRef = useRef(null);
  // Kullanıcı token'ı alınmalı (örnek: localStorage'dan)
  const token = localStorage.getItem("token");
  // Fetch current settings once
  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        setInitialLoaded(true);
        return;
      }
      setLoading(true);
      try {
        const res = await apiRequest("settings-get", { method: "GET", token });
        if (!active) return;
        const merged = { ...settings, ...(res.settings || {}) };
        setSettings(merged);
        dispatch(
          updatePreferences({
            language: merged.language,
            notifications: merged.notifications,
            theme: merged.theme,
          })
        );
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) {
          setLoading(false);
          setInitialLoaded(true);
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save
  const queueSave = useCallback(
    (next) => {
      setSettings(next);
      setError(null);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        if (!token) return;
        setSaving(true);
        try {
          const res = await apiRequest("settings-update", {
            method: "POST",
            data: next,
            token,
          });
          dispatch(
            updatePreferences({
              language: res.settings.language,
              notifications: res.settings.notifications,
              theme: res.settings.theme,
            })
          );
        } catch (e) {
          setError(e.message);
        } finally {
          setSaving(false);
        }
      }, 500); // 500ms debounce
    },
    [dispatch, token]
  );

  const toggleTheme = () => {
    const newDark = !darkMode;
    toggleDarkMode();
    queueSave({ ...settings, theme: newDark ? "dark" : "light" });
  };
  // navigate & dispatch already declared above

  const handleResetStats = () => {
    if (window.confirm("Tüm istatistikleriniz silinecek. Emin misiniz?")) {
      dispatch(resetStats());
      alert("İstatistikler sıfırlandı!");
    }
  };

  const handleResetWelcome = () => {
    localStorage.removeItem("hasVisited");
    alert(
      "Hoş geldin ekranı sıfırlandı. Uygulamayı yeniden yüklediğinizde göreceksiniz."
    );
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button
          onClick={() => navigate("/")}
          className="secondary-button"
          style={{ width: "fit-content", padding: "0.6rem 1.1rem" }}
        >
          ← Geri
        </button>
        <h1 className="settings-header__title">Ayarlar</h1>
        <p className="settings-header__subtitle">
          Uygulama deneyimini kişiselleştir. Tema, dil, bildirim tercihleri ve
          daha fazlası.
        </p>
      </div>
      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card__row">
            <div className="settings-card__info">
              <div className="settings-card__icon">
                {darkMode ? <HiMoon /> : <HiSun />}
              </div>
              <div>
                <div className="settings-card__title">Tema</div>
                <div className="settings-card__desc">
                  {darkMode ? "Koyu tema" : "Açık tema"}
                </div>
              </div>
            </div>
            <div
              className={`switch ${darkMode ? "switch--on" : ""}`}
              role="switch"
              aria-checked={darkMode}
              tabIndex={0}
              onClick={toggleTheme}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && toggleTheme()
              }
            >
              <div className="switch__thumb" />
            </div>
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card__row">
            <div className="settings-card__info">
              <div className="settings-card__icon">
                <HiTranslate />
              </div>
              <div>
                <div className="settings-card__title">Dil</div>
                <div className="settings-card__desc">Arayüz dili</div>
              </div>
            </div>
            <select
              value={settings.language}
              onChange={(e) =>
                queueSave({ ...settings, language: e.target.value })
              }
              disabled={loading}
              style={{ maxWidth: "140px" }}
            >
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card__row">
            <div className="settings-card__info">
              <div className="settings-card__icon">
                <HiBell />
              </div>
              <div>
                <div className="settings-card__title">Bildirimler</div>
                <div className="settings-card__desc">Günlük hatırlatmalar</div>
              </div>
            </div>
            <div
              className={`switch ${settings.notifications ? "switch--on" : ""}`}
              role="switch"
              aria-checked={settings.notifications}
              tabIndex={0}
              onClick={() =>
                queueSave({
                  ...settings,
                  notifications: !settings.notifications,
                })
              }
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                queueSave({
                  ...settings,
                  notifications: !settings.notifications,
                })
              }
            >
              <div className="switch__thumb" />
            </div>
          </div>
        </div>
        <div className="settings-card">
          <div className="settings-card__row">
            <div className="settings-card__info">
              <div className="settings-card__icon">
                <HiVolumeUp />
              </div>
              <div>
                <div className="settings-card__title">Ses Efektleri</div>
                <div className="settings-card__desc">
                  Quiz seslerini aç/kapat
                </div>
              </div>
            </div>
            <div
              className={`switch ${settings.sound ? "switch--on" : ""}`}
              role="switch"
              aria-checked={settings.sound}
              tabIndex={0}
              onClick={() => queueSave({ ...settings, sound: !settings.sound })}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") &&
                queueSave({ ...settings, sound: !settings.sound })
              }
            >
              <div className="switch__thumb" />
            </div>
          </div>
        </div>
        <div
          className="settings-card"
          role="button"
          tabIndex={0}
          onClick={handleResetWelcome}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && handleResetWelcome()
          }
        >
          <div className="settings-card__info">
            <div className="settings-card__icon">
              <HiRefresh />
            </div>
            <div>
              <div className="settings-card__title">
                Hoş Geldin Ekranını Sıfırla
              </div>
              <div className="settings-card__desc">
                İlk açılış ekranını tekrar göster
              </div>
            </div>
          </div>
        </div>
        <div
          className="settings-card"
          style={{
            borderColor: "rgba(255,55,95,0.35)",
            background: "rgba(255,55,95,0.08)",
          }}
          role="button"
          tabIndex={0}
          onClick={handleResetStats}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === " ") && handleResetStats()
          }
        >
          <div className="settings-card__info">
            <div
              className="settings-card__icon"
              style={{ background: "rgba(255,55,95,0.18)", color: "#ff375f" }}
            >
              <HiTrash />
            </div>
            <div>
              <div
                className="settings-card__title"
                style={{ color: "#ff375f" }}
              >
                İstatistikleri Sıfırla
              </div>
              <div className="settings-card__desc">
                Tüm verileriniz silinecek
              </div>
            </div>
          </div>
        </div>
        <div className="settings-card">
          {saving && (
            <span className="settings-meta-inline settings-meta-inline--saving">
              KAYDEDİLİYOR
            </span>
          )}
          {error && !saving && (
            <span className="settings-meta-inline settings-meta-inline--error">
              HATA
            </span>
          )}
          <div className="settings-card__info">
            <div className="settings-card__icon">
              <HiInformationCircle />
            </div>
            <div>
              <div className="settings-card__title">English Quiz Master</div>
              <div className="settings-card__desc">
                Versiyon 1.0.0 • React + Tailwind + Netlify
              </div>
              <div className="settings-card__desc" style={{ marginTop: "4px" }}>
                Stil sistemi: global.css bileşen odaklı
              </div>
            </div>
          </div>
        </div>
        <div className="settings-card">
          <div
            className="settings-card__title"
            style={{ marginBottom: "0.25rem" }}
          >
            Oturum
          </div>
          <LogoutButton />
          {auth?.user && (
            <div
              className="settings-card__desc"
              style={{ marginTop: "0.5rem", wordBreak: "break-all" }}
            >
              {auth.user.email}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
