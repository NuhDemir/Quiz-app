import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const WelcomeScreen = ({ onComplete }) => {
  const containerRef = useRef()
  const titleRef = useRef()
  const subtitleRef = useRef()
  const descriptionRef = useRef()
  const buttonRef = useRef()

  useEffect(() => {
    const tl = gsap.timeline()
    
    // Initial setup
    gsap.set([titleRef.current, subtitleRef.current, descriptionRef.current, buttonRef.current], {
      opacity: 0,
      y: 50
    })

    // Animation sequence
    tl.to(titleRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out'
    })
    .to(subtitleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '-=0.3')
    .to(descriptionRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out'
    }, '-=0.2')
    .to(buttonRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'back.out(1.7)'
    }, '-=0.1')

    // Floating animation for the title
    gsap.to(titleRef.current, {
      y: -10,
      duration: 2,
      ease: 'power1.inOut',
      yoyo: true,
      repeat: -1
    })
  }, [])

  const handleGetStarted = () => {
    // Button press animation
    gsap.to(buttonRef.current, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
      onComplete: () => {
        // Start exit animation
        const exitTl = gsap.timeline()
        exitTl.to([titleRef.current, subtitleRef.current, descriptionRef.current, buttonRef.current], {
          opacity: 0,
          y: -30,
          duration: 0.4,
          stagger: 0.1,
          ease: 'power2.in'
        })
        .to(containerRef.current, {
          opacity: 0,
          scale: 0.9,
          duration: 0.6,
          ease: 'power2.inOut',
          onComplete: onComplete
        }, '-=0.2')
      }
    })
  }

  return (
    <div 
      ref={containerRef}
      className="welcome-screen min-h-screen bg-gradient-to-br from-primary/20 via-background-light to-primary/10 dark:from-background-dark dark:via-background-dark dark:to-primary/20 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary rounded-full blur-lg animate-pulse delay-500"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* App Icon/Logo */}
        <div 
          ref={titleRef}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto mb-4 bg-primary rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            🎯
          </div>
          <h1 className="text-2xl font-bold text-background-dark dark:text-background-light">
            English Quiz Master
          </h1>
        </div>

        {/* Welcome text */}
        <div 
          ref={subtitleRef}
          className="mb-2"
        >
          <h2 className="text-4xl font-bold text-background-dark dark:text-background-light mb-2">
            Test Your English
          </h2>
        </div>

        <div 
          ref={descriptionRef}
          className="mb-12"
        >
          <p className="text-lg text-background-dark/70 dark:text-background-light/70 leading-relaxed">
            Improve your English skills with fun and engaging quizzes. Choose a new quiz or review your past performance.
          </p>
        </div>

        {/* Get Started Button */}
        <div ref={buttonRef}>
          <button 
            onClick={handleGetStarted}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl active:scale-95"
          >
            Get Started
          </button>
        </div>

        {/* Skip option */}
        <button 
          onClick={onComplete}
          className="mt-6 text-background-dark/60 dark:text-background-light/60 hover:text-primary dark:hover:text-primary transition-colors duration-300 text-sm"
        >
          Skip Introduction
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen