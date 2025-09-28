import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { 
  HiMoon, 
  HiSun, 
  HiTranslate, 
  HiVolumeUp, 
  HiBell,
  HiRefresh,
  HiTrash,
  HiInformationCircle
} from 'react-icons/hi'
import { resetStats } from '../store/userSlice'

const Settings = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleResetStats = () => {
    if (window.confirm('Tüm istatistikleriniz silinecek. Emin misiniz?')) {
      dispatch(resetStats())
      alert('İstatistikler sıfırlandı!')
    }
  }

  const handleResetWelcome = () => {
    localStorage.removeItem('hasVisited')
    alert('Hoş geldin ekranı sıfırlandı. Uygulamayı yeniden yüklediğinizde göreceksiniz.')
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-background-dark dark:text-background-light">
      {/* Header */}
      <header className="p-6 pt-16">
        <button 
          onClick={() => navigate('/')}
          className="mb-4 p-2 rounded-full hover:bg-primary/10 transition-colors duration-300"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-background-dark/60 dark:text-background-light/60">
          Customize your app experience
        </p>
      </header>

      {/* Settings List */}
      <div className="px-6 space-y-4">
        
        {/* Theme */}
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <HiMoon className="text-2xl text-primary" /> : <HiSun className="text-2xl text-primary" />}
              <div>
                <h3 className="font-bold">Tema</h3>
                <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                  {darkMode ? 'Koyu tema' : 'Açık tema'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${
                darkMode ? 'bg-primary' : 'bg-background-dark/20 dark:bg-background-light/20'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 absolute top-0.5 ${
                darkMode ? 'translate-x-6' : 'translate-x-0.5'
              }`}></div>
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiTranslate className="text-2xl text-primary" />
              <div>
                <h3 className="font-bold">Dil</h3>
                <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                  Türkçe
                </p>
              </div>
            </div>
            <div className="text-background-dark/40 dark:text-background-light/40">
              Coming Soon
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiBell className="text-2xl text-primary" />
              <div>
                <h3 className="font-bold">Bildirimler</h3>
                <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                  Günlük hatırlatmalar
                </p>
              </div>
            </div>
            <div className="text-background-dark/40 dark:text-background-light/40">
              Coming Soon
            </div>
          </div>
        </div>

        {/* Sound */}
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HiVolumeUp className="text-2xl text-primary" />
              <div>
                <h3 className="font-bold">Ses Efektleri</h3>
                <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                  Quiz seslerini aç/kapat
                </p>
              </div>
            </div>
            <div className="text-background-dark/40 dark:text-background-light/40">
              Coming Soon
            </div>
          </div>
        </div>

        {/* Reset Welcome Screen */}
        <button
          onClick={handleResetWelcome}
          className="w-full bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4"
        >
          <div className="flex items-center gap-3">
            <HiRefresh className="text-2xl text-primary" />
            <div className="text-left">
              <h3 className="font-bold">Hoş Geldin Ekranını Sıfırla</h3>
              <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                İlk açılış ekranını tekrar göster
              </p>
            </div>
          </div>
        </button>

        {/* Reset Stats */}
        <button
          onClick={handleResetStats}
          className="w-full bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-500/20"
        >
          <div className="flex items-center gap-3">
            <HiTrash className="text-2xl text-red-500" />
            <div className="text-left">
              <h3 className="font-bold text-red-500">İstatistikleri Sıfırla</h3>
              <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                Tüm verileriniz silinecek
              </p>
            </div>
          </div>
        </button>

        {/* App Info */}
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <HiInformationCircle className="text-2xl text-primary" />
            <div>
              <h3 className="font-bold">English Quiz Master</h3>
              <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                Versiyon 1.0.0
              </p>
              <p className="text-xs text-background-dark/50 dark:text-background-light/50 mt-1">
                React + Tailwind CSS + GSAP ile geliştirildi
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Settings