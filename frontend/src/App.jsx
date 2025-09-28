import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import BottomNavigation from './components/BottomNavigation'
import WelcomeScreen from './components/WelcomeScreen'
import { gsap } from 'gsap'

function App() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('hasVisited')
    if (hasVisited) {
      setShowWelcome(false)
    }

    // Check dark mode preference
    const darkModePreference = localStorage.getItem('darkMode')
    if (darkModePreference === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    // GSAP initial animation
    gsap.fromTo('.app-container', 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
    )
  }, [])

  const handleWelcomeComplete = () => {
    localStorage.setItem('hasVisited', 'true')
    
    // Animate welcome screen exit
    gsap.to('.welcome-screen', {
      opacity: 0,
      scale: 0.8,
      duration: 0.6,
      ease: 'power2.inOut',
      onComplete: () => setShowWelcome(false)
    })
  }

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', newMode.toString())
    
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (showWelcome) {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />
  }

  return (
    <div className={`app-container min-h-screen bg-background-light dark:bg-background-dark font-display transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="flex flex-col min-h-screen pb-20">
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/quiz/:category" element={<Quiz />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<Settings darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
          </Routes>
        </main>
        <BottomNavigation />
      </div>
    </div>
  )
}

export default App