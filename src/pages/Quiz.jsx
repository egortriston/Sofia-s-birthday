import { useState, Suspense, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { ParticleSphere } from "@/components/ui/3d-orbit-gallery"
import { QuizCards3D } from "@/components/ui/QuizCards3D"
import { ElectricCard } from "@/components/ui/electric-card"
import ElectricBorder from "@/components/ui/ElectricBorder"
import { SolarLoader } from "@/components/ui/solar-loader"
import { questions, hints } from '../data/questions'
import { sendToTelegram } from '../utils/telegram'
import './Quiz.css'

function Quiz() {
  const navigate = useNavigate()
  const [selectedCard, setSelectedCard] = useState(null)
  const [answeredCards, setAnsweredCards] = useState(new Set())
  const [userAnswers, setUserAnswers] = useState({})
  const [showDipsy, setShowDipsy] = useState(false)
  const [dipsyMessage, setDipsyMessage] = useState('')
  const [showPrize, setShowPrize] = useState(false)
  const [prizeMessage, setPrizeMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const canvasReadyRef = useRef(false)
  const cardsLoadedRef = useRef(false)

  useEffect(() => {
    // Fallback таймер на случай, если загрузка не отслеживается корректно
    const fallbackTimer = setTimeout(() => {
      if (isLoading) {
        console.warn('Загрузка превысила таймаут, принудительно скрываем лоадер')
        setIsLoading(false)
      }
    }, 10000) // 10 секунд максимум

    return () => clearTimeout(fallbackTimer)
  }, [isLoading])

  const handleAllCardsLoaded = () => {
    cardsLoadedRef.current = true
    checkIfReady()
  }

  const handleCanvasReady = () => {
    canvasReadyRef.current = true
    checkIfReady()
  }

  const checkIfReady = () => {
    // Ждем и Canvas, и все карточки
    if (canvasReadyRef.current && cardsLoadedRef.current) {
      setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }
  }

  const handleCardClick = (cardId) => {
    if (answeredCards.has(cardId)) return
    setSelectedCard(cardId)
    setShowDipsy(false)
    setShowPrize(false)
  }

  const handleAnswerSubmit = async (cardId, userAnswer) => {
    const question = questions.find(q => q.id === cardId)
    if (!question) return

    // Нормализация ответов: убираем пробелы, приводим к нижнему регистру
    const normalize = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ')

    let isCorrect = false
    let userAnswerText = typeof userAnswer === 'string' ? userAnswer : ''

    if (question.type === 'crossword') {
      const solution = question.crosswordSolution || []
      const grid = userAnswer?.gridValues || []
      if (typeof userAnswer?.isCorrect === 'boolean') {
        isCorrect = userAnswer.isCorrect
      } else {
        // Проверяем, что каждая активная клетка совпадает с решением
        isCorrect = solution.every((row, ri) =>
          row.every((cell, ci) => {
            if (cell === null) return true
            const val = grid?.[ri]?.[ci] || ''
            return val.toUpperCase() === cell.toUpperCase()
          })
        )
      }
      userAnswerText = userAnswer?.userText || ''
    } else {
      const normalizedUserAnswer = normalize(userAnswer || '')
      const normalizedCorrectAnswer = normalize(question.answer)
      // Специальная обработка для вопросов с "*любой ответ верен*"
      isCorrect = question.answer.includes('*любой ответ верен*') 
        ? (userAnswer || '').trim().length > 0  // Любой непустой ответ считается правильным
        : normalizedUserAnswer === normalizedCorrectAnswer
    }

    // Отправка в Telegram
    await sendToTelegram(question.question, userAnswerText, question.answer, isCorrect)

    if (isCorrect) {
      setAnsweredCards(prev => new Set([...prev, cardId]))
      setUserAnswers(prev => ({ ...prev, [cardId]: userAnswer }))
      setSelectedCard(null)
      setShowPrize(true)
      const description = question.prizeDescription 
        ? `${question.prize} - ${question.prizeDescription}`
        : `Твой приз: ${question.prize}`
      setPrizeMessage(`Верно! ${description}`)
    } else {
      const randomHint = hints[Math.floor(Math.random() * hints.length)]
      setDipsyMessage(`Не совсем! Подсказка: ${randomHint}`)
      setShowDipsy(true)
      setTimeout(() => setShowDipsy(false), 4000)
    }
  }

  const progress = answeredCards.size
  const allAnswered = progress === 21

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4ade80'
      case 'medium': return '#fbbf24'
      case 'hard': return '#f87171'
      default: return '#60a5fa'
    }
  }

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Легкий'
      case 'medium': return 'Средний'
      case 'hard': return 'Тяжелый'
      default: return ''
    }
  }

  // Экран загрузки
  if (isLoading) {
    return <SolarLoader size={60} speed={1} message="Загрузка карточек..." />
  }

  return (
    <div className="quiz-page relative w-full h-screen bg-black">
      {/* 3D Scene with Cards */}
      <Canvas 
        camera={{ position: [-12, 1.5, 12], fov: 50 }}
        onCreated={() => {
          // Canvas готов, даем время на инициализацию
          setTimeout(() => {
            handleCanvasReady()
          }, 200)
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Suspense fallback={null}>
          <ParticleSphere />
          <QuizCards3D
            questions={questions}
            answeredCards={answeredCards}
            onCardClick={handleCardClick}
            getDifficultyColor={getDifficultyColor}
            onAllCardsLoaded={handleAllCardsLoaded}
          />
        </Suspense>
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
         
          makeDefault
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="quiz-header pointer-events-none">
          <h2>Исследование космоса</h2>
          <div className="progress-counter">
            Исследовано: {progress}/21
          </div>
        </div>

        {/* Модальное окно с вопросом */}
        {selectedCard && !answeredCards.has(selectedCard) && (
          <QuestionModal
            question={questions.find(q => q.id === selectedCard)}
            onSubmit={(answer) => handleAnswerSubmit(selectedCard, answer)}
            onClose={() => setSelectedCard(null)}
            difficultyColor={getDifficultyColor(questions.find(q => q.id === selectedCard)?.difficulty)}
            difficultyLabel={getDifficultyLabel(questions.find(q => q.id === selectedCard)?.difficulty)}
          />
        )}

        {showDipsy && (
          <div className="dipsy-popup pointer-events-auto">
            <div className="dipsy-avatar">👽</div>
            <div className="dipsy-message">{dipsyMessage}</div>
          </div>
        )}

        {showPrize && (
          <div 
            className="prize-overlay pointer-events-auto"
            onClick={() => setShowPrize(false)}
          >
            <div className="prize-popup" onClick={() => setShowPrize(false)}>
              <div className="prize-icon">🎁</div>
              <div className="prize-message">{prizeMessage}</div>
            </div>
          </div>
        )}

        {allAnswered && (
          <button 
            className="final-button pointer-events-auto"
            onClick={() => navigate('/finale')}
          >
            К финалу!
          </button>
        )}
      </div>
    </div>
  )
}

function CrosswordPuzzle({ solution, onSubmit, onClose, accentColor }) {
  const [grid, setGrid] = useState(
    () => (solution || []).map(row => row.map(cell => (cell === null ? null : '')))
  )
  const [error, setError] = useState('')
  const [mismatches, setMismatches] = useState(null)

  const columns = useMemo(() => {
    if (!solution || solution.length === 0) return 0
    return Math.max(...solution.map(row => row.length))
  }, [solution])

  const handleChange = (rowIndex, colIndex, value) => {
    const normalized = value.replace(/[^А-Яа-яЁёA-Za-z]/g, '').slice(-1).toUpperCase()
    setGrid(prev => prev.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri === rowIndex && ci === colIndex && cell !== null) {
          return normalized
        }
        return cell
      })
    ))
    setMismatches(null)
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const allFilled = solution.every((row, ri) =>
      row.every((cell, ci) => cell === null || (grid?.[ri]?.[ci] || '').trim() !== '')
    )

    if (!allFilled) {
      setError('Заполни все клетки.')
      return
    }

    const mismatchMap = solution.map((row, ri) =>
      row.map((cell, ci) => {
        if (cell === null) return false
        const val = (grid?.[ri]?.[ci] || '').toUpperCase()
        return val !== cell.toUpperCase()
      })
    )

    const hasMismatch = mismatchMap.some(row => row.some(Boolean))
    setMismatches(mismatchMap)

    const userText = (grid.flat().filter(Boolean).join('')) || ''
    setError(hasMismatch ? 'Исправь выделенные клетки.' : '')
    onSubmit({ gridValues: grid, userText, isCorrect: !hasMismatch })
  }

  if (!solution || columns === 0) return null

  return (
    <div className="crossword-wrapper" style={{ '--crossword-accent': accentColor }}>
      <div className="crossword-hint">Введи буквы в каждую клетку и нажми «Проверить»</div>
      <form onSubmit={handleSubmit}>
        <div
          className="crossword-grid"
          style={{ gridTemplateColumns: `repeat(${columns}, 38px)` }}
        >
          {solution.map((row, ri) =>
            row.map((cell, ci) => {
              const key = `${ri}-${ci}`
              if (cell === null) {
                return <div key={key} className="crossword-cell blocked" />
              }
              const isWrong = mismatches?.[ri]?.[ci]
              return (
                <div key={key} className={`crossword-cell${isWrong ? ' wrong' : ''}`}>
                  <input
                    type="text"
                    maxLength={1}
                    className={`crossword-input${isWrong ? ' wrong' : ''}`}
                    value={grid?.[ri]?.[ci] || ''}
                    onChange={(e) => handleChange(ri, ci, e.target.value)}
                  />
                </div>
              )
            })
          )}
        </div>
        {error && <div className="crossword-error">{error}</div>}
        <div className="question-modal-buttons">
          <button
            type="submit"
            className="question-submit-btn"
            style={{ backgroundColor: accentColor }}
          >
            Проверить
          </button>
          <button
            type="button"
            className="question-cancel-btn"
            onClick={onClose}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

function QuestionModal({ question, onSubmit, onClose, difficultyColor, difficultyLabel }) {
  const [answer, setAnswer] = useState('')
  const isCrossword = question?.type === 'crossword'

  if (!question) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (answer.trim()) {
      onSubmit(answer)
      setAnswer('')
    }
  }

  return (
    <div className="question-modal-overlay pointer-events-auto" onClick={onClose}>
      <div 
        className="question-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <ElectricBorder
          color={difficultyColor}
          speed={1}
          chaos={0.6}
          thickness={2}
          style={{ borderRadius: 20 }}
        >
          <ElectricCard
            variant={question.difficulty === 'hard' ? 'hue' : 'swirl'}
            color={difficultyColor}
            badge={difficultyLabel}
            title={`Вопрос #${question.id}`}
            description={question.question}
          >
          <div className="question-content-scroll">
            {isCrossword ? (
              <CrosswordPuzzle
                solution={question.crosswordSolution}
                onSubmit={onSubmit}
                onClose={onClose}
                accentColor={difficultyColor}
              />
            ) : (
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  className="question-input"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Введите ваш ответ..."
                  autoFocus
                />
                <div className="question-modal-buttons">
                  <button
                    type="submit"
                    className="question-submit-btn"
                    style={{ backgroundColor: difficultyColor }}
                  >
                    Ответить
                  </button>
                  <button
                    type="button"
                    className="question-cancel-btn"
                    onClick={onClose}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
          </ElectricCard>
        </ElectricBorder>
      </div>
    </div>
  )
}

export default Quiz

