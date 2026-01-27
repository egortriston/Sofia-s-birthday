import { useState, useEffect, useRef } from 'react'
import { checkAnswerWithAI, getHintFromAI, getAngryMessage } from '../../utils/deepseek'
import { sendAIMessage } from '../../utils/telegram'
import startImg from '../../images/Start.png'
import think1Img from '../../images/think1.png'
import think2Img from '../../images/think2.png'
import talkImg from '../../images/talk.png'
import angry1Img from '../../images/angry1.png'
import win1Img from '../../images/win1.png'
import win2Img from '../../images/win2.png'

// Состояния ассистента
const STATES = {
  START: 'start',
  THINKING: 'thinking',
  TALKING: 'talking',
  ANGRY: 'angry',
  WIN: 'win'
}

export function AIAssistant({ 
  question, 
  correctAnswer, 
  userAnswer = '', 
  onAnswerCheck,
  isAnswerCorrect = null,
  prize = null,
  prizeDescription = null,
  onClose = null,
  isCrossword = false
}) {
  const [state, setState] = useState(STATES.START)
  const [displayedMessage, setDisplayedMessage] = useState('')
  const [fullMessage, setFullMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [thinkImage, setThinkImage] = useState(null)
  const [winImage, setWinImage] = useState(null)
  const [previousAnswer, setPreviousAnswer] = useState(null)
  const [isShaking, setIsShaking] = useState(false)
  const typingTimeoutRef = useRef(null)
  const processedAnswerRef = useRef(null)
  const previousStateRef = useRef(null)
  const speechBubbleRef = useRef(null)

  // Функция постепенной печати текста
  const typeText = (text, callback, shouldSendToTelegram = true) => {
    setDisplayedMessage('')
    let index = 0
    
    // Отправляем сообщение в Telegram только один раз
    if (shouldSendToTelegram) {
      sendAIMessage(text)
    }
    
    const type = () => {
      if (index < text.length) {
        setDisplayedMessage(text.slice(0, index + 1))
        index++
        // Автоматический скролл вниз при печати
        if (speechBubbleRef.current) {
          speechBubbleRef.current.scrollTop = speechBubbleRef.current.scrollHeight
        }
        typingTimeoutRef.current = setTimeout(type, 30) // Скорость печати
      } else if (callback) {
        // Финальный скролл после завершения печати
        if (speechBubbleRef.current) {
          speechBubbleRef.current.scrollTop = speechBubbleRef.current.scrollHeight
        }
        callback()
      }
    }
    
    type()
  }

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Тряска при смене картинки
  useEffect(() => {
    if (previousStateRef.current !== null && previousStateRef.current !== state) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 300)
    }
    previousStateRef.current = state
  }, [state])

  // Обработка изменения состояния при проверке ответа
  useEffect(() => {
    console.log('🔄 AIAssistant useEffect:', {
      isAnswerCorrect,
      userAnswer,
      userAnswerType: typeof userAnswer,
      userAnswerLength: userAnswer?.length,
      question,
      processedAnswerRef: processedAnswerRef.current
    })
    
    // Если есть отправленный ответ пользователя (submittedAnswer) и isAnswerCorrect === null, 
    // значит ответ отправлен и ждем проверки - включаем THINKING сразу
    // Проверяем тип userAnswer - для кроссворда это объект, для обычных вопросов - строка
    const hasUserAnswer = userAnswer && (
      typeof userAnswer === 'string' ? userAnswer.trim() : 
      typeof userAnswer === 'object' ? (userAnswer.gridValues || userAnswer.userText) : 
      false
    )
    if (hasUserAnswer && isAnswerCorrect === null && processedAnswerRef.current !== 'thinking') {
      // Устанавливаем thinkImage один раз и фиксируем его
      const selectedThinkImage = Math.random() < 0.5 ? think1Img : think2Img
      setThinkImage(selectedThinkImage)
      setIsLoading(true)
      setState(STATES.THINKING)
      processedAnswerRef.current = 'thinking'
      return
    }
    
    // Предотвращаем двойную обработку
    if (processedAnswerRef.current === isAnswerCorrect) {
      return
    }
    
    if (isAnswerCorrect === true) {
      processedAnswerRef.current = true
      // Правильный ответ - показываем победу
      setIsLoading(true)
      setState(STATES.THINKING)
      if (!thinkImage) {
        setThinkImage(Math.random() < 0.5 ? think1Img : think2Img)
      }
      
      setTimeout(() => {
        if (!winImage) {
          setWinImage(Math.random() < 0.5 ? win1Img : win2Img)
        }
        setState(STATES.WIN)
        let winMessage = 'Поздравляю! Ты молодец! 🎉'
        if (prize && prizeDescription) {
          winMessage = `Твой приз - ${prize}... ${prizeDescription}`
        } else if (prize) {
          winMessage = `Твой приз - ${prize}`
        } else if (prizeDescription) {
          winMessage = prizeDescription
        }
        setFullMessage(winMessage)
        typeText(winMessage, () => {
          // Не закрываем оверлей автоматически - пользователь закроет сам через крестик
          setIsLoading(false)
        })
      }, 1000)
    } else if (isAnswerCorrect === false) {
      processedAnswerRef.current = false
      
      // Для кроссворда не используем AI - просто показываем сообщение локально
      if (isCrossword) {
        setState(STATES.ANGRY)
        const errorMsg = 'Исправь выделенные клетки и попробуй снова! 😤'
        setFullMessage(errorMsg)
        typeText(errorMsg, null, false) // Не отправляем в Telegram для кроссворда
        setIsLoading(false)
        return
      }
      
      // Неправильный ответ - показываем злость через AI
      // Сразу включаем состояние THINKING
      setIsLoading(true)
      setState(STATES.THINKING)
      if (!thinkImage) {
        setThinkImage(Math.random() < 0.5 ? think1Img : think2Img)
      }
      
      // Сохраняем предыдущий ответ для будущих подсказок
      if (userAnswer && typeof userAnswer === 'string') {
        setPreviousAnswer(userAnswer)
      }
      
      // Получаем злое сообщение от AI сразу
      const userAnswerText = typeof userAnswer === 'string' ? userAnswer : ''
      console.log('🔴 Неправильный ответ - отправляем в AI:', {
        question,
        userAnswer: userAnswerText,
        correctAnswer,
        userAnswerType: typeof userAnswer,
        userAnswerLength: userAnswerText?.length
      })
      getAngryMessage(question, userAnswerText, correctAnswer).then(angryMsg => {
        console.log('🔴 Получено злое сообщение от AI:', angryMsg)
        setState(STATES.ANGRY)
        setFullMessage(angryMsg)
        typeText(angryMsg)
        setIsLoading(false)
      }).catch(error => {
        console.error('🔴 Ошибка получения злого сообщения:', error)
        setState(STATES.ANGRY)
        setIsLoading(false)
      })
    } else if (isAnswerCorrect === null && !userAnswer) {
      // Сбрасываем состояние только если это новый вопрос (нет отправленного ответа)
      // Не сбрасываем если мы уже в процессе обработки ответа
      if (processedAnswerRef.current !== 'thinking') {
        processedAnswerRef.current = null
        setState(STATES.START)
        setDisplayedMessage('')
        setFullMessage('')
        setThinkImage(null)
        setWinImage(null)
        setPreviousAnswer(null)
        setIsLoading(false)
      }
    }
  }, [isAnswerCorrect, prize, prizeDescription, question, correctAnswer, userAnswer, onClose, thinkImage, winImage])


  const handleGetHint = async () => {
    // Для кроссворда подсказки не используются
    if (isCrossword) {
      return
    }
    
    setIsLoading(true)
    setState(STATES.THINKING)
    setDisplayedMessage('')
    setFullMessage('')
    
    // Случайно выбираем think1 или think2
    if (!thinkImage) {
      setThinkImage(Math.random() < 0.5 ? think1Img : think2Img)
    }
    
    try {
      // Передаем предыдущий ответ для более точной подсказки
      const hint = await getHintFromAI(question, correctAnswer, previousAnswer)
      setState(STATES.TALKING)
      setFullMessage(hint)
      typeText(hint)
    } catch (error) {
      setState(STATES.TALKING)
      const errorMsg = 'Ой, что-то пошло не так! Попробуй еще раз 🌟'
      setFullMessage(errorMsg)
      typeText(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // Определяем какое изображение показывать
  const getCurrentImage = () => {
    switch (state) {
      case STATES.START:
        return startImg
      case STATES.THINKING:
        // Используем уже установленное изображение, не меняем его
        return thinkImage || think1Img
      case STATES.TALKING:
        return talkImg
      case STATES.ANGRY:
        return angry1Img
      case STATES.WIN:
        // Используем уже установленное изображение, не меняем его
        return winImage || win1Img
      default:
        return startImg
    }
  }

  return (
    <div className="ai-assistant-simple">
      <div className="ai-avatar-container">
        <img 
          src={getCurrentImage()} 
          alt="Софья" 
          className={`ai-avatar-simple ${isShaking ? 'shake' : ''}`}
        />
        {(displayedMessage || fullMessage) && (
          <div className="ai-speech-bubble" ref={speechBubbleRef}>
            <div className="ai-speech-bubble-content">
              {displayedMessage || fullMessage}
            </div>
            <div className="ai-speech-bubble-tail"></div>
          </div>
        )}
      </div>
      
      {/* Кнопка всегда видна (кроме кроссворда и win).
          В пассиве показывает "Слушаю" и не активна. */}
      {!isCrossword && state !== STATES.WIN && (() => {
        const isThinking = isLoading || state === STATES.THINKING
        const isIdle = !isThinking && state === STATES.START && !displayedMessage && !fullMessage
        const label = isThinking ? 'Думаю...' : isIdle ? 'Слушаю' : 'Подсказка'
        const disabled = isThinking || isIdle

        return (
        <button
          className="ai-hint-button"
          onClick={handleGetHint}
          disabled={disabled}
        >
          {label}
        </button>
        )
      })()}
    </div>
  )
}
