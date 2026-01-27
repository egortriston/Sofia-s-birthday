import { useState, Suspense, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { ParticleSphere } from "@/components/ui/3d-orbit-gallery"
import { QuizCards3D } from "@/components/ui/QuizCards3D"
import { ElectricCard } from "@/components/ui/electric-card"
import ElectricBorder from "@/components/ui/ElectricBorder"
import { SolarLoader } from "@/components/ui/solar-loader"
import { AIAssistant } from "@/components/ui/AIAssistant"
import { checkAnswerWithAI } from '../utils/deepseek'
import { questions, hints } from '../data/questions'
import { sendToTelegram, sendCompletionMessage } from '../utils/telegram'
import './Quiz.css'

function Quiz() {
  const navigate = useNavigate()
  const [selectedCard, setSelectedCard] = useState(null)

  // Загружаем прогресс из localStorage при инициализации
  const loadProgress = () => {
    try {
      const savedAnswered = localStorage.getItem('quiz-progress-answered')
      const savedAnswers = localStorage.getItem('quiz-progress-answers')

      const answeredSet = savedAnswered
        ? new Set(JSON.parse(savedAnswered).map(Number))
        : new Set()

      const answersObj = savedAnswers
        ? JSON.parse(savedAnswers)
        : {}

      return { answeredSet, answersObj }
    } catch (error) {
      console.error('Ошибка при загрузке прогресса:', error)
      return { answeredSet: new Set(), answersObj: {} }
    }
  }

  const { answeredSet, answersObj } = loadProgress()
  const [answeredCards, setAnsweredCards] = useState(answeredSet)
  const [userAnswers, setUserAnswers] = useState(answersObj)
  const [showDipsy, setShowDipsy] = useState(false)
  const [dipsyMessage, setDipsyMessage] = useState('')
  const [showPrize, setShowPrize] = useState(false)
  const [prizeMessage, setPrizeMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const canvasReadyRef = useRef(false)
  const cardsLoadedRef = useRef(false)

  // Сохраняем прогресс в localStorage при изменении
  useEffect(() => {
    try {
      const answeredArray = Array.from(answeredCards)
      localStorage.setItem('quiz-progress-answered', JSON.stringify(answeredArray))
    } catch (error) {
      console.error('Ошибка при сохранении прогресса:', error)
    }
  }, [answeredCards])

  useEffect(() => {
    try {
      localStorage.setItem('quiz-progress-answers', JSON.stringify(userAnswers))
    } catch (error) {
      console.error('Ошибка при сохранении ответов:', error)
    }
  }, [userAnswers])

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
      // Добавляем задержку 2 секунды, чтобы карточки успели отобразиться
      // Теперь карточки рендерятся сразу, поэтому задержка нужна только для визуального эффекта
      setTimeout(() => {
        setIsLoading(false)
      }, 2000)
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
    if (!question) return false

    // Нормализация букв: ё = е
    const normalizeLetter = (char) => {
      if (char === 'ё' || char === 'Ё') return 'е'
      if (char === 'е' || char === 'Е') return 'е'
      return char.toLowerCase()
    }

    // Нормализация ответов: убираем пробелы, приводим к нижнему регистру, заменяем ё на е
    const normalize = (str) => {
      return str.trim()
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/\s+/g, ' ')
    }

    // Нормализация для сравнения букв (для кроссворда)
    const normalizeChar = (char) => {
      const upper = char.toUpperCase()
      if (upper === 'Ё' || upper === 'Е') return 'Е'
      return upper
    }

    let isCorrect = false
    let userAnswerText = typeof userAnswer === 'string' ? userAnswer : ''

    if (question.type === 'crossword') {
      const solution = question.crosswordSolution || []
      const grid = userAnswer?.gridValues || []
      if (typeof userAnswer?.isCorrect === 'boolean') {
        isCorrect = userAnswer.isCorrect
      } else {
        // Проверяем, что каждая активная клетка совпадает с решением (ё = е)
        isCorrect = solution.every((row, ri) =>
          row.every((cell, ci) => {
            if (cell === null) return true
            const val = grid?.[ri]?.[ci] || ''
            return normalizeChar(val) === normalizeChar(cell)
          })
        )
      }
      userAnswerText = userAnswer?.userText || ''
    } else {
      // Проверяем ответ через AI
      userAnswerText = userAnswer || ''
      try {
        const aiResult = await checkAnswerWithAI(question.question, userAnswerText, question.answer)
        isCorrect = aiResult.isCorrect

        // Дополнительная локальная проверка для предотвращения принятия сокращений
        // Если AI принял ответ, но локальная проверка показывает, что это сокращение - отклоняем
        if (isCorrect) {
          const normalizedUserAnswer = normalize(userAnswerText)
          const normalizedCorrectAnswer = normalize(question.answer)

          // Если ответы не совпадают точно
          if (normalizedUserAnswer !== normalizedCorrectAnswer) {
            // Проверяем, является ли ответ началом правильного ответа (сокращение)
            const isAbbreviation = normalizedCorrectAnswer.startsWith(normalizedUserAnswer)
            const lengthRatio = normalizedUserAnswer.length / normalizedCorrectAnswer.length

            // Если это сокращение (ответ является началом правильного) и длина меньше 70% - отклоняем
            if (isAbbreviation && lengthRatio < 0.7) {
              console.log('⚠️ Отклонено как сокращение:', { userAnswer: normalizedUserAnswer, correctAnswer: normalizedCorrectAnswer, lengthRatio })
              isCorrect = false
            }
            // Если ответ не является началом правильного и не совпадает - тоже отклоняем
            else if (!isAbbreviation && normalizedUserAnswer.length < normalizedCorrectAnswer.length * 0.8) {
              console.log('⚠️ Отклонено - неполное совпадение:', { userAnswer: normalizedUserAnswer, correctAnswer: normalizedCorrectAnswer })
              isCorrect = false
            }
          }
        }
      } catch (error) {
        console.error('Ошибка проверки ответа через AI:', error)
        // Fallback на локальную проверку при ошибке AI
        const normalizedUserAnswer = normalize(userAnswerText)
        const normalizedCorrectAnswer = normalize(question.answer)
        isCorrect = question.answer.includes('*любой ответ верен*')
          ? userAnswerText.trim().length > 0
          : normalizedUserAnswer === normalizedCorrectAnswer
      }
    }

    // Отправка в Telegram
    await sendToTelegram(question.question, userAnswerText, question.answer, isCorrect)

    if (isCorrect) {
      setAnsweredCards(prev => new Set([...prev, cardId]))
      setUserAnswers(prev => ({ ...prev, [cardId]: userAnswer }))
      // Не показываем окно подарка - AI ассистент сам скажет
    } else {
      // Неправильный ответ - показываем только через AI ассистента
      // Убрали автоматическое окно dipsy
    }

    // Возвращаем результат для использования в QuestionModalWithState
    return isCorrect
  }

  const progress = answeredCards.size
  const allAnswered = progress === 21

  // Отправляем сообщение в Telegram, когда все вопросы отвечены
  useEffect(() => {
    if (allAnswered) {
      sendCompletionMessage()
    }
  }, [allAnswered])

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
      {/* 3D Scene with Cards - рендерим всегда, чтобы карточки загружались */}
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

      {/* Лоадер поверх Canvas */}
      {isLoading && (
        <SolarLoader size={60} speed={1} message="Загрузка карточек..." />
      )}

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="quiz-header pointer-events-none">
          <h2>Исследование космоса</h2>
          <div className="progress-counter">
            Пройдено: {progress}/21
          </div>
        </div>

        {/* Модальное окно с вопросом — рендер в body поверх портала drei Html (z-index до 16777271), иначе свечение карточек перекрывает оверлей */}
        {selectedCard && createPortal(
          <QuestionModalWithState
            question={questions.find(q => q.id === selectedCard)}
            onSubmit={(answer) => handleAnswerSubmit(selectedCard, answer)}
            onClose={() => setSelectedCard(null)}
            difficultyColor={getDifficultyColor(questions.find(q => q.id === selectedCard)?.difficulty)}
            difficultyLabel={getDifficultyLabel(questions.find(q => q.id === selectedCard)?.difficulty)}
            isAnswered={answeredCards.has(selectedCard)}
          />,
          document.body
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
  const [grid, setGrid] = useState(() => {
    if (!solution || solution.length === 0) {
      return []
    }

    // Создаем массив всех активных клеток (не null)
    const activeCells = []
    solution.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        if (cell !== null) {
          activeCells.push({ row: ri, col: ci, value: cell })
        }
      })
    })

    // Перемешиваем массив случайным образом
    const shuffled = [...activeCells].sort(() => Math.random() - 0.5)

    // Берем половину клеток для предзаполнения
    const cellsToFill = Math.floor(activeCells.length / 2)
    const filledCells = new Set()
    shuffled.slice(0, cellsToFill).forEach(cell => {
      filledCells.add(`${cell.row}-${cell.col}`)
    })

    // Создаем grid с предзаполненными клетками
    return solution.map((row, ri) =>
      row.map((cell, ci) => {
        if (cell === null) return null
        const key = `${ri}-${ci}`
        return filledCells.has(key) ? cell : ''
      })
    )
  })
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

    // Нормализация для сравнения букв (ё = е)
    const normalizeChar = (char) => {
      const upper = char.toUpperCase()
      if (upper === 'Ё' || upper === 'Е') return 'Е'
      return upper
    }

    const mismatchMap = solution.map((row, ri) =>
      row.map((cell, ci) => {
        if (cell === null) return false
        const val = grid?.[ri]?.[ci] || ''
        return normalizeChar(val) !== normalizeChar(cell)
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

// Компонент-обертка для управления состоянием ответа
function QuestionModalWithState({ question, onSubmit, onClose, difficultyColor, difficultyLabel }) {
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null)
  const [prize, setPrize] = useState(null)
  const [prizeDescription, setPrizeDescription] = useState(null)
  const [submittedAnswer, setSubmittedAnswer] = useState(null)

  // Сбрасываем состояние при изменении вопроса
  useEffect(() => {
    setIsAnswerCorrect(null)
    setPrize(null)
    setPrizeDescription(null)
    setSubmittedAnswer(null)
  }, [question?.id])

  const handleSubmit = async (answer) => {
    // Сохраняем ответ перед отправкой
    setSubmittedAnswer(answer)
    console.log('📝 Сохранен ответ для AI:', answer)

    if (question.type === 'crossword') {
      // Для кроссворда проверка будет в handleAnswerSubmit
      setIsAnswerCorrect(null) // Сбрасываем для показа загрузки
      // Вызываем onSubmit и получаем результат проверки
      // handleAnswerSubmit - async функция, возвращает промис
      try {
        const result = onSubmit(answer)
        // Обрабатываем результат (может быть промис или синхронное значение)
        if (result && typeof result.then === 'function') {
          result.then(isCorrect => {
            if (isCorrect) {
              setIsAnswerCorrect(true)
              setPrize(question.prize)
              setPrizeDescription(question.prizeDescription)
            } else {
              setIsAnswerCorrect(false)
            }
          }).catch(error => {
            console.error('❌ Ошибка проверки кроссворда:', error)
            setIsAnswerCorrect(false)
          })
        } else {
          // Синхронный результат (не должен быть, но на всякий случай)
          if (result) {
            setIsAnswerCorrect(true)
            setPrize(question.prize)
            setPrizeDescription(question.prizeDescription)
          } else {
            setIsAnswerCorrect(false)
          }
        }
      } catch (error) {
        console.error('❌ Ошибка при вызове onSubmit для кроссворда:', error)
        setIsAnswerCorrect(false)
      }
    } else {
      // Проверяем ответ через AI
      // Сразу устанавливаем null чтобы AI ассистент перешел в состояние THINKING
      setIsAnswerCorrect(null) // Сбрасываем для показа загрузки
      console.log('📝 Проверка ответа через AI:', {
        question: question.question,
        userAnswer: answer,
        correctAnswer: question.answer,
        answerType: typeof answer,
        answerLength: answer?.length
      })
      try {
        const result = await checkAnswerWithAI(question.question, answer, question.answer)
        console.log('✅ Результат проверки AI:', result)

        if (result.isCorrect) {
          setIsAnswerCorrect(true)
          setPrize(question.prize)
          setPrizeDescription(question.prizeDescription)
        } else {
          setIsAnswerCorrect(false)
        }
        onSubmit(answer)
      } catch (error) {
        console.error('❌ Ошибка проверки ответа:', error)
        setIsAnswerCorrect(false)
        onSubmit(answer)
      }
    }
  }

  return (
    <QuestionModal
      question={question}
      onSubmit={handleSubmit}
      onClose={onClose}
      difficultyColor={difficultyColor}
      difficultyLabel={difficultyLabel}
      isAnswerCorrect={isAnswerCorrect}
      prize={prize}
      prizeDescription={prizeDescription}
      submittedAnswer={submittedAnswer}
    />
  )
}

function QuestionModal({ question, onSubmit, onClose, difficultyColor, difficultyLabel, isAnswerCorrect, prize, prizeDescription, submittedAnswer }) {
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
      {/* Крестик для закрытия в левом верхнем углу экрана - показывается только после правильного ответа */}
      {isAnswerCorrect === true && (
        <button
          className="question-modal-close"
          onClick={onClose}
          aria-label="Закрыть"
        />
      )}
      <div className="question-modal-container">
        {/* AI Ассистент слева — клик по нему не закрывает модалку */}
        <div className="question-modal-assistant" onClick={(e) => e.stopPropagation()}>
          <AIAssistant
            question={question.question}
            correctAnswer={question.answer}
            userAnswer={isCrossword && submittedAnswer && typeof submittedAnswer === 'object'
              ? submittedAnswer.userText || ''
              : submittedAnswer || ''}
            isAnswerCorrect={isAnswerCorrect}
            prize={prize}
            prizeDescription={prizeDescription}
            onClose={onClose}
            isCrossword={isCrossword}
          />
        </div>

        {/* Основное модальное окно с вопросом — скрывается при правильном ответе; клик по нему не закрывает модалку */}
        {isAnswerCorrect !== true && (
          <div className="question-modal" onClick={(e) => e.stopPropagation()}>
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
        )}
      </div>
    </div>
  )
}

export default Quiz

