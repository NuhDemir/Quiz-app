import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { gsap } from 'gsap'
import { 
  HiPlay, 
  HiChartBar, 
  HiAcademicCap, 
  HiTrendingUp,
  HiClock,
  HiFire
} from 'react-icons/hi'
import categories from '../data/categories.json'
import levels from '../data/levels.json'

const Home = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate()
  const { stats } = useSelector(state => state.user)
  const headerRef = useRef()
  const statsRef = useRef()
  const actionsRef = useRef()
  
  const getCurrentLevel = () => {
    const accuracy = stats.accuracy || 0
    return levels.find(level => 
      accuracy >= level.minAccuracy && accuracy < level.maxAccuracy
    ) || levels[0]
  }

  const currentLevel = getCurrentLevel()

  useEffect(() => {
    // GSAP animations for home page
    const tl = gsap.timeline()
    
    tl.fromTo(headerRef.current, 
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo(statsRef.current.children, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.7)' },
      '-=0.4'
    )
    .fromTo(actionsRef.current.children, 
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' },
      '-=0.2'
    )
  }, [])

  const handleStartNewQuiz = () => {
    // Button animation
    gsap.to(event.target, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
      onComplete: () => navigate('/categories')
    })
  }

  const handleReviewQuizzes = () => {
    // Button animation  
    gsap.to(event.target, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
      onComplete: () => navigate('/profile')
    })
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-background-dark dark:text-background-light">
      {/* Header */}
      <header ref={headerRef} className="p-6 pt-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">English Quiz Master</h1>
            <p className="text-background-dark/60 dark:text-background-light/60 text-sm mt-1">
              Hoş geldin! İngilizce yolculuğuna devam et 🎯
            </p>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-300"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Current Level Badge */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Mevcut Seviye</h3>
              <p className="text-2xl font-black" style={{ color: currentLevel.color }}>
                {currentLevel.nameTr} ({currentLevel.id})
              </p>
              <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                %{Math.round(stats.accuracy || 0)} doğruluk oranı
              </p>
            </div>
            <div className="text-4xl">
              <HiAcademicCap style={{ color: currentLevel.color }} />
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-background-dark/10 dark:bg-background-light/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(stats.accuracy || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div ref={statsRef} className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <HiChartBar className="text-2xl text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalQuestions || 0}</p>
            <p className="text-xs text-background-dark/60 dark:text-background-light/60">Toplam Soru</p>
          </div>
          
          <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <HiTrendingUp className="text-2xl text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(stats.accuracy || 0)}%</p>
            <p className="text-xs text-background-dark/60 dark:text-background-light/60">Başarı</p>
          </div>
          
          <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <HiFire className="text-2xl text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.streak || 0}</p>
            <p className="text-xs text-background-dark/60 dark:text-background-light/60">Seri</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">Test Your English</h2>
          <p className="text-background-dark/70 dark:text-background-light/70 mb-12 text-center">
            Improve your English skills with fun and engaging quizzes. Choose a new quiz or review your past performance.
          </p>
          
          <div ref={actionsRef} className="space-y-4">
            <button 
              onClick={handleStartNewQuiz}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-3"
            >
              <HiPlay className="text-xl" />
              Start New Quiz
            </button>
            
            <button 
              onClick={handleReviewQuizzes}
              className="w-full bg-primary/20 dark:bg-primary/30 text-primary font-bold py-4 rounded-xl text-lg hover:bg-primary/30 dark:hover:bg-primary/40 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              <HiClock className="text-xl" />
              Review Past Quizzes
            </button>
          </div>
        </div>
      </main>

      {/* Quick Categories Preview */}
      <div className="px-6 mt-12 mb-8">
        <h3 className="text-xl font-bold mb-4">Popular Categories</h3>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {categories.slice(0, 3).map((category) => (
            <div 
              key={category.id}
              onClick={() => navigate(`/quiz/${category.id}`)}
              className="min-w-[140px] bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform duration-300"
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <h4 className="font-bold text-sm">{category.nameTr}</h4>
              <p className="text-xs text-background-dark/60 dark:text-background-light/60">
                {category.totalQuestions} soru
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Home