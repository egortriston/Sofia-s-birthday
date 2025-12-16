import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Starfield } from '@/components/ui/starfield-1'
import AnoAI from '@/components/ui/animated-shader-background'
import { LampContainer } from '@/components/ui/lamp'
import LightPillar from '@/components/ui/LightPillar'
import photo1 from '@/images/1.png'
import photo2 from '@/images/2.png'
import photo13 from '@/images/13.png'
import './Introduction.css'

function Introduction() { 
  const navigate = useNavigate()
  const [showContent, setShowContent] = useState(false)
  const [showSecondSection, setShowSecondSection] = useState(false)
  const [showThirdSection, setShowThirdSection] = useState(false)
  const containerRef = useRef(null)
  const secondSectionRef = useRef(null)
  const thirdSectionRef = useRef(null)
  const isScrolling = useRef(false)

  useEffect(() => {
    setTimeout(() => setShowContent(true), 500)
    
    // Проверяем видимость секций сразу при загрузке
    const checkVisibility = () => {
      const container = containerRef.current
      if (!container) return

      if (secondSectionRef.current) {
        const rect = secondSectionRef.current.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const isVisible = rect.top < containerRect.bottom && rect.bottom > containerRect.top
        if (isVisible) {
          setShowSecondSection(true)
        }
      }
      if (thirdSectionRef.current) {
        const rect = thirdSectionRef.current.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const isVisible = rect.top < containerRect.bottom && rect.bottom > containerRect.top
        if (isVisible) {
          setShowThirdSection(true)
        }
      }
    }

    // Проверяем после небольшой задержки, чтобы DOM успел отрендериться
    setTimeout(checkVisibility, 100)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current
      if (!container) return

      if (secondSectionRef.current) {
        const rect = secondSectionRef.current.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        // Проверяем видимость относительно контейнера
        const isVisible = rect.top < containerRect.bottom && rect.bottom > containerRect.top
        if (isVisible) {
          setShowSecondSection(true)
        }
      }
      if (thirdSectionRef.current) {
        const rect = thirdSectionRef.current.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        const isVisible = rect.top < containerRect.bottom && rect.bottom > containerRect.top
        if (isVisible) {
          setShowThirdSection(true)
        }
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll() // Проверяем при загрузке
    }
    window.addEventListener('scroll', handleScroll)

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    let scrollTimeout = null
    let lastWheelTime = 0
    let scrollAnimationId = null

    const smoothScrollTo = (element, target, duration) => {
      const start = element.scrollTop
      const change = target - start
      const startTime = performance.now()

      const animateScroll = (currentTime) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing функция для более плавного перехода (ease-in-out-cubic)
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2

        element.scrollTop = start + change * ease

        if (progress < 1) {
          scrollAnimationId = requestAnimationFrame(animateScroll)
        } else {
          isScrolling.current = false
          scrollAnimationId = null
        }
      }

      scrollAnimationId = requestAnimationFrame(animateScroll)
    }

    const handleWheel = (e) => {
      if (isScrolling.current) {
        e.preventDefault()
        return
      }

      const container = containerRef.current
      if (!container) return

      const now = Date.now()
      if (now - lastWheelTime < 50) {
        e.preventDefault()
        return // Минимальный дебаунс для предотвращения множественных срабатываний
      }
      lastWheelTime = now

      const sections = container.querySelectorAll('.snap-section')
      const currentScroll = container.scrollTop
      const windowHeight = window.innerHeight
      const currentSection = Math.round(currentScroll / windowHeight)

      let targetSection = currentSection
      const threshold = 30 // Уменьшенный порог для более чувствительного скролла

      if (e.deltaY > threshold && currentSection < sections.length - 1) {
        targetSection = currentSection + 1
        e.preventDefault()
      } else if (e.deltaY < -threshold && currentSection > 0) {
        targetSection = currentSection - 1
        e.preventDefault()
      } else {
        return // Небольшой скролл - разрешаем обычную прокрутку
      }

      if (targetSection !== currentSection) {
        isScrolling.current = true
        const targetScroll = targetSection * windowHeight

        // Отменяем предыдущую анимацию если она есть
        if (scrollAnimationId) {
          cancelAnimationFrame(scrollAnimationId)
        }

        // Используем кастомную плавную прокрутку
        smoothScrollTo(container, targetScroll, 500) // 500ms для более быстрого перехода

        // Резервная блокировка на случай если анимация не завершится
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          isScrolling.current = false
        }, 600)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      clearTimeout(scrollTimeout)
      if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId)
      }
      if (container) {
        container.removeEventListener('wheel', handleWheel)
      }
    }
  }, [])

  const handleStart = () => {
    try {
      console.log('Начало навигации на /quiz')
      navigate('/quiz')
    } catch (error) {
      console.error('Ошибка навигации:', error)
      // Fallback: прямая навигация через window.location
      window.location.href = '/quiz'
    }
  }

  return (
    <div ref={containerRef} className="relative w-full snap-container">
      {/* Первая секция с световым столбом + эффект лампы и фото снизу */}
      <div className="snap-section relative flex h-screen w-full flex-col items-center justify-start md:justify-start overflow-hidden pt-0 md:pt-0">
        <div className="absolute inset-0">
          <LightPillar
            topColor="#1d2140"
            bottomColor="#4c1d95"
            intensity={0.9}
            rotationSpeed={0.22}
            glowAmount={0.006}
            pillarWidth={3.0}
            pillarHeight={0.5}
            noiseIntensity={0.7}
            pillarRotation={0}
            interactive={false}
            mixBlendMode="screen"
          />
        </div>

        {/* Текст без лампы (фон только от LightPillar) */}
        <div className={`pointer-events-none z-10 px-0 md:px-0 pt-4 md:pt-20 pb-2 md:pb-0 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-1000`}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ delay: 0, duration: 0.9, ease: 'easeInOut' }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(56,189,248,0.9)]">
              Космическое приключение
            </h1>
            <div className="text-container max-w-3xl mx-auto mb-10 px-4 md:px-0">
              <p className="greeting-text text-xl mb-6 text-white/90">
                Добро пожаловать в космическое путешествие, Софья! 
                Сегодня тебя ждет удивительное приключение среди звезд и планет.
              </p>
              <p className="rules-text text-lg mb-4 text-white/80">
                Ты знаешь, что для меня ты всегда была и есть самая главная звездочка! Поэтому я хотел бы подарить такое маленкькое приключение, где ты - это главная звезда)
              </p>
              <p className="rules-text text-lg text-white/80">
                Чуть позже я тебе объясню правила, а пока, с твоего разрешения, давай я тебя поздравлю)))
              </p>
            </div>
          </motion.div>
        </div>

        {/* Фото снизу с тёплым свечением лампы позади и лёгкой плавной анимацией */}
        <motion.div
          initial={{ opacity: 0, y: 120 }}
          animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 120 }}
          transition={{ delay: 1.1, duration: 1.1, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center w-full"
          style={{ zIndex: 5 }}
        >
          <LampContainer variant="photo">
            <motion.img
              src={photo13}
              alt="Космическое фото"
              className="relative w-[400px] md:w-70 lg:w-[30rem] h-auto rounded-3xl origin-bottom"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </LampContainer>
        </motion.div>
      </div>

      {/* Вторая секция с анимированным фоном */}
      <div 
        ref={secondSectionRef}
        className="snap-section relative flex h-screen w-full overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <AnoAI />
        </div>
        
        <div className="relative z-20 w-full h-full flex items-center justify-center pointer-events-auto">
          <div className="w-full max-w-7xl mx-auto px-0 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-60 items-center">
            {/* Левая половина - летающее фото */}
            <div className="flex items-center justify-center relative z-30">
              <div 
                className={`floating-photo ${showSecondSection ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} transition-all duration-1000 ease-out`}
                style={{ visibility: showSecondSection ? 'visible' : 'visible' }}
              >
                <img 
                  src={photo1} 
                  alt="Поздравление" 
                  className="photo-no-glow w-full max-w-md h-auto rounded-2xl shadow-2xl"
                  style={{ display: 'block' }}
                />
              </div>
            </div>

            {/* Правая половина - текст поздравления */}
            <div 
              className={`flex flex-col items-start justify-center text-white relative z-30 ${showSecondSection ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'} transition-all duration-1000 delay-300 ease-out`}
              style={{ visibility: showSecondSection ? 'visible' : 'visible' }}
            >
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                С Днем Рождения!
              </h2>
              <div className="space-y-4 text-base md:text-lg leading-relaxed">
                <p className="text-white/90">
                  Дорогая Соша! Сегодня особенный день - день твоего рождения!
                </p>
                <p className="text-white/90">
                  Ты уже вообще взрослая. 21 год... Скоро уже и 25... а там уже не в моей зоне ответственности))
                  Как и в любой другой день, я тебе желаю только всего самого лучшего!
                  Я не особо умею говорить красивые слова, но, надеюсь, мой подарок тебе понравится!
                </p>
                <p className="text-white/90">
                  Ты мой самый дорогой человек и поэтому я постарался тебе сделать такую открытку, не знаю, видно ли это, но я потратил на это очень много сил! Поэтому я очень надеюсь, что он тебе западет в твое огромное сердце!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Третья секция с кнопкой */}
      <div 
        ref={thirdSectionRef}
        className="snap-section relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black via-purple-900/20 to-black"
      >
        <Starfield speed={0.55} starColor="rgba(255,255,255,1)" quantity={2400} />
        <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center px-4 md:px-8 py-4 md:py-12 min-h-0">
          {/* Контент: текст слева, фото справа */}
          <div className={`w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-60 items-center mb-4 md:mb-8 flex-shrink ${showThirdSection ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-1000`}>
            {/* Левая половина - текст */}
            <div className="flex flex-col items-start justify-center text-white">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                А теперь суть подарка!
              </h2>
              <div className="space-y-2 md:space-y-4 text-sm md:text-lg leading-relaxed">
                <p className="text-white/90">
                  Готова ли ты, Жабка, отправиться в это увлекательное космическое путешествие?
                </p>
                <p className="text-white/90">
                  Перед тобой будет 21 карточка, каждая из которых скрывает интересный вопрос.
                  Они поделены на 3 уровня сложностя. Зеленые - легкие, желтые - средние, а красные - как терпеть тебя на парах, сложно, что пиздец. Естественно, от уровня сложности зависит и крутизна подарка! Но советую, начать с самых легких, так будет интереснее, да и я старался сделать нарастающий эффект от призов) 
                </p>
                <p className="text-white/90">
                  Не бойся ошибиться - если что-то пойдет не так, тебе помогу либо я, либо нейронка с подсказкой.
                  Ну что? Вперед? 
                </p>
              </div>
            </div>

            {/* Правая половина - фото */}
            <div className="flex items-center justify-center">
              <div 
                className={`floating-photo ${showThirdSection ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} transition-all duration-1000 delay-300`}
              >
                <img 
                  src={photo2} 
                  alt="Начать игру" 
                  className="w-52 md:w-full max-w-md h-auto rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Кнопка внизу */}
          <div className={`w-full flex justify-center mt-4 md:mt-0 flex-shrink-0 ${showThirdSection ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} transition-all duration-1000 delay-500`}>
            <button 
              className="pointer-events-auto z-30 relative px-8 md:px-16 py-4 md:py-6 text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transform"
              onClick={handleStart}
              type="button"
            >
              Начать путешествие 
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Introduction

