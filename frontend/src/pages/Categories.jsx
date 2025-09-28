import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { gsap } from 'gsap'
import { HiChevronRight, HiAcademicCap } from 'react-icons/hi'
import categories from '../data/categories.json'
import levels from '../data/levels.json'

const Categories = () => {
  const navigate = useNavigate()
  const { stats } = useSelector(state => state.user)
  const headerRef = useRef()
  const categoriesRef = useRef()
  const levelsRef = useRef()

  useEffect(() => {
    const tl = gsap.timeline()
    
    tl.fromTo(headerRef.current, 
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    )
    .fromTo(categoriesRef.current.children, 
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.7)' },
      '-=0.4'
    )
    .fromTo(levelsRef.current.children, 
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' },
      '-=0.3'
    )
  }, [])

  const handleCategorySelect = (categoryId) => {
    navigate(`/quiz/${categoryId}`)
  }

  const getCategoryProgress = (categoryId) => {
    return stats.categoryStats?.[categoryId]?.accuracy || 0
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-background-dark dark:text-background-light">
      {/* Header */}
      <header ref={headerRef} className="p-6 pt-16">
        <button 
          onClick={() => navigate('/')}
          className="mb-4 p-2 rounded-full hover:bg-primary/10 transition-colors duration-300"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold mb-2">Quiz Categories</h1>
        <p className="text-background-dark/60 dark:text-background-light/60">
          Choose a category to start practicing
        </p>
      </header>

      {/* Categories Grid */}
      <div ref={categoriesRef} className="px-6 mb-8">
        <div className="space-y-4">
          {categories.map((category) => {
            const progress = getCategoryProgress(category.id)
            
            return (
              <div
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-6 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{category.nameTr}</h3>
                      <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                        {category.name}
                      </p>
                      <p className="text-sm text-background-dark/60 dark:text-background-light/60">
                        {category.totalQuestions} soru
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {progress > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: category.color }}>
                          %{Math.round(progress)}
                        </p>
                        <p className="text-xs text-background-dark/60 dark:text-background-light/60">
                          tamamlandı
                        </p>
                      </div>
                    )}
                    <HiChevronRight className="text-2xl text-primary" />
                  </div>
                </div>
                
                {/* Progress bar */}
                {progress > 0 && (
                  <div className="mt-4">
                    <div className="h-2 bg-background-dark/10 dark:bg-background-light/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${progress}%`,
                          backgroundColor: category.color
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Levels Section */}
      <div className="px-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Difficulty Levels</h2>
        <div ref={levelsRef} className="grid grid-cols-2 gap-3">
          {levels.map((level) => (
            <div
              key={level.id}
              className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center"
            >
              <HiAcademicCap 
                className="text-3xl mx-auto mb-2" 
                style={{ color: level.color }}
              />
              <h3 className="font-bold text-lg">{level.id}</h3>
              <p className="text-sm font-medium">{level.nameTr}</p>
              <p className="text-xs text-background-dark/60 dark:text-background-light/60 mt-1">
                {level.descriptionTr}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Categories