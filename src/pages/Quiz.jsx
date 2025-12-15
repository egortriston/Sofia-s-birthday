import { useState, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { ParticleSphere } from "@/components/ui/3d-orbit-gallery"
import { QuizCards3D } from "@/components/ui/QuizCards3D"
import { ElectricCard } from "@/components/ui/electric-card"
import ElectricBorder from "@/components/ui/ElectricBorder"
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
    const normalizedUserAnswer = normalize(userAnswer)
    const normalizedCorrectAnswer = normalize(question.answer)
    
    // Специальная обработка для вопросов с "*любой ответ верен*"
    const isCorrect = question.answer.includes('*любой ответ верен*') 
      ? userAnswer.trim().length > 0  // Любой непустой ответ считается правильным
      : normalizedUserAnswer === normalizedCorrectAnswer

    // Отправка в Telegram
    await sendToTelegram(question.question, userAnswer, question.answer, isCorrect)

    if (isCorrect) {
      setAnsweredCards(prev => new Set([...prev, cardId]))
      setUserAnswers(prev => ({ ...prev, [cardId]: userAnswer }))
      setSelectedCard(null)
      setShowPrize(true)
      const description = question.prizeDescription 
        ? `${question.prize} — ${question.prizeDescription}`
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

  return (
    <div className="quiz-page relative w-full h-screen bg-black">
      {/* 3D Scene with Cards */}
      <Canvas camera={{ position: [-10, 1.5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Suspense fallback={null}>
          <ParticleSphere />
          <QuizCards3D
            questions={questions}
            answeredCards={answeredCards}
            onCardClick={handleCardClick}
            getDifficultyColor={getDifficultyColor}
          />
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
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

function QuestionModal({ question, onSubmit, onClose, difficultyColor, difficultyLabel }) {
  const [answer, setAnswer] = useState('')

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
          </ElectricCard>
        </ElectricBorder>
      </div>
    </div>
  )
}

export default Quiz

