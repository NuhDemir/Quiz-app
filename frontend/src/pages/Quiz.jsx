import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { gsap } from 'gsap'
import { 
  HiClock, 
  HiX, 
  HiCheck, 
  HiChevronLeft, 
  HiChevronRight,
  HiLightBulb,
  HiFlag
} from 'react-icons/hi'
import { 
  startQuiz, 
  answerQuestion, 
  nextQuestion, 
  previousQuestion, 
  endQuiz, 
  resetQuiz 
} from '../store/quizSlice'
import { updateStats, addBadge } from '../store/userSlice'
import questions from '../data/questions.json'
import categories from '../data/categories.json'
import badges from '../data/badges.json'

const Quiz = () => {
  const { category } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  
  const { 
    currentSession, 
    questions: quizQuestions, 
    currentQuestionIndex, 
    answers,
    isActive,
    results 
  } = useSelector(state => state.quiz)
  
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)
  
  const questionRef = useRef()
  const optionsRef = useRef()
  const timerRef = useRef()
  
  const currentCategory = categories.find(cat => cat.id === category)
  const currentQuestion = quizQuestions[currentQuestionIndex]
  
  useEffect(() => {
    if (!isActive && !results) {
      // Start new quiz
      const categoryQuestions = questions.filter(q => q.category === category)
      const selectedQuestions = categoryQuestions
        .sort(() => Math.random() - 0.5)
        .slice(0, 10) // Take 10 random questions
      
      dispatch(startQuiz({
        questions: selectedQuestions,
        category: category,
        level: 'mixed'
      }))
      
      setTimeLeft(30) // 30 seconds per question
    }
  }, [category, dispatch, isActive, results])
  
  useEffect(() => {
    if (currentQuestion && !answerSubmitted) {
      // Animate question change
      const tl = gsap.timeline()
      
      tl.fromTo(questionRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
      )
      .fromTo(optionsRef.current?.children || [],
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.4, stagger: 0.1, ease: 'back.out(1.7)' },
        '-=0.3'
      )
      
      setTimeLeft(currentQuestion.timeLimit || 30)
      setSelectedAnswer('')
      setShowHint(false)
    }
  }, [currentQuestionIndex, answerSubmitted])
  
  const handleQuitQuiz = () => {
    dispatch(resetQuiz())
    navigate('/categories')
  }
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark text-background-dark dark:text-background-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Quiz yükleniyor...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-background-dark dark:text-background-light p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">Quiz: {currentCategory?.nameTr}</h1>
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <p className="text-lg">{currentQuestion.question.text}</p>
        </div>
        <button 
          onClick={handleQuitQuiz}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg"
        >
          Quiz'den Çık
        </button>
      </div>
    </div>
  )
}

export default Quiz