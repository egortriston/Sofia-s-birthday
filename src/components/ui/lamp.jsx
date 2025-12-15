import React from 'react'
import { motion } from 'framer-motion'

// Упрощённый вариант LampContainer из aceternity/lamp
// Делает мягкое круговое свечение под контентом
// variant:
// - "text"  : мягкое фиолетово-розовое свечение за текстом
// - "photo" : тёплое жёлтое свечение за фото
export const LampContainer = ({ children, variant = 'text' }) => {
  const isPhoto = variant === 'photo'

  const mainBg = isPhoto
    ? 'bg-[radial-gradient(circle_at_center,_rgba(252,211,77,0.18),_transparent_95%)]'
    : 'bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.15),_rgba(236,72,153,0.08)_55%,_transparent_92%)]'

  const highlightBg = isPhoto
    ? 'bg-[radial-gradient(circle_at_top,_rgba(252,211,77,0.4),_transparent_80%)]'
    : 'bg-[radial-gradient(circle_at_top,_rgba(244,244,245,0.16),_transparent_75%)]'

  const sizeClass = isPhoto
    ? 'h-[14rem] w-[90%] md:h-[18rem] md:w-[90%]'
    : 'h-56 w-56 md:h-[20rem] md:w-[16rem]'

  const highlightSizeClass = isPhoto
    ? 'h-32 w-32 md:h-44 md:w-44'
    : 'h-32 w-32 md:h-44 md:w-44'

  return (
    <div className="relative flex w-full items-center justify-center">
      {/* Фон‑свечение */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className={`relative ${sizeClass} rounded-full ${mainBg} blur-3xl`}
        />
      </div>

      {/* Лёгкий сверху отблеск */}
      <div className={`pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 ${highlightSizeClass} rounded-full ${highlightBg} blur-2xl`} />

      {/* Контент поверх лампы */}
      <div className="relative z-10 flex w-full items-center justify-center">
        {children}
      </div>
    </div>
  )
}


