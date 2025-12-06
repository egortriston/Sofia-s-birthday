import { useRef, useState } from 'react'
import { Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import cardImage from '../../images/photo_2025-04-19_21-05-17.jpg'

const CARD_IMAGE_SIZE = 1.5

export function QuizCard3D({ 
  question, 
  position, 
  rotation, 
  isAnswered, 
  difficultyColor,
  onCardClick,
  imageIndex = 0
}) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  // Используем локальное изображение как временную заставку для всех карточек
  const texture = useTexture(cardImage)
  
  // Настройка текстуры
  if (texture) {
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.flipY = false
  }

  const color = difficultyColor || '#60a5fa'

  return (
    <group position={position} rotation={rotation}>
      {/* Звездообразное свечение СЗАДИ карточки */}
      {!isAnswered && (
        <Html
          transform
          distanceFactor={0.6}
          position={[0, 0, -0.03]}
          style={{
            pointerEvents: 'none',
            width: `${CARD_IMAGE_SIZE * 500}px`,
            height: `${CARD_IMAGE_SIZE * 500}px`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Размытое звездообразное свечение вокруг карточки */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: `radial-gradient(circle, transparent 10%, ${color}40 20%, ${color}70 30%, transparent 50%)`,
                filter: 'blur(30px)',
                borderRadius: '50%',
              }}
            />
            {/* Лучи звезды, выходящие за пределы карточки */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => {
              const rad = (angle * Math.PI) / 180
              const centerX = 50
              const centerY = 50
              const rayLength = 100
              const startX = centerX + Math.cos(rad) * 10
              const startY = centerY + Math.sin(rad) * 10
              
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${startX}%`,
                    top: `${startY}%`,
                    width: '12px',
                    height: `${rayLength - 10}px`,
                    background: `linear-gradient(to ${angle < 180 ? 'bottom' : 'top'}, ${color}90, ${color}60, transparent)`,
                    borderRadius: '6px',
                    transformOrigin: 'top center',
                    transform: `rotate(${angle}deg)`,
                    filter: 'blur(10px)',
                    opacity: 0.9,
                  }}
                />
              )
            })}
          </div>
        </Html>
      )}
      
      {/* Серое звездообразное свечение СЗАДИ для отвеченных карточек */}
      {isAnswered && (
        <Html
          transform
          distanceFactor={0.6}
          position={[0, 0, -0.03]}
          style={{
            pointerEvents: 'none',
            width: `${CARD_IMAGE_SIZE * 500}px`,
            height: `${CARD_IMAGE_SIZE * 500}px`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Размытое серое свечение вокруг карточки */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, transparent 10%, rgba(156, 163, 175, 0.35) 20%, rgba(156, 163, 175, 0.55) 30%, transparent 50%)',
                filter: 'blur(30px)',
                borderRadius: '50%',
              }}
            />
            {/* Серые лучи звезды */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => {
              const rad = (angle * Math.PI) / 180
              const centerX = 50
              const centerY = 50
              const rayLength = 100
              const startX = centerX + Math.cos(rad) * 10
              const startY = centerY + Math.sin(rad) * 10
              
              return (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    left: `${startX}%`,
                    top: `${startY}%`,
                    width: '12px',
                    height: `${rayLength - 10}px`,
                    background: 'linear-gradient(to bottom, rgba(156, 163, 175, 0.7), rgba(156, 163, 175, 0.4), transparent)',
                    borderRadius: '6px',
                    transformOrigin: 'top center',
                    transform: `rotate(${angle}deg)`,
                    filter: 'blur(10px)',
                    opacity: 0.7,
                  }}
                />
              )
            })}
          </div>
        </Html>
      )}

      {/* Сама карточка с фотографией */}
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => !isAnswered && onCardClick()}
        scale={hovered && !isAnswered ? 1.1 : 1}
      >
        <planeGeometry args={[CARD_IMAGE_SIZE, CARD_IMAGE_SIZE]} />
        <meshBasicMaterial 
          map={texture}
          transparent 
          opacity={isAnswered ? 0.5 : 1}
          side={THREE.DoubleSide}
        />
      
        {/* Overlay с номером в углу */}
        {!isAnswered && (
          <Html
            transform
            distanceFactor={0.3}
            position={[-CARD_IMAGE_SIZE/2 + 0.1, CARD_IMAGE_SIZE/2 - 0.1, 0.01]}
            style={{
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                background: color,
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: `0 0 5px ${color}40`,
                border: '2px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {question.id}
            </div>
          </Html>
        )}

        {/* Индикатор отвеченной карточки */}
        {isAnswered && (
          <Html
            transform
            distanceFactor={0.3}
            position={[0, 0, 0.01]}
            style={{
              pointerEvents: 'none',
              width: `${CARD_IMAGE_SIZE * 100}px`,
              height: `${CARD_IMAGE_SIZE * 100}px`,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(75, 85, 99, 0.8)',
                borderRadius: '10px',
              }}
            >
              <div style={{ fontSize: '36px', color: '#4ade80', marginBottom: '10px' }}>✓</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Отвечено</div>
            </div>
          </Html>
        )}
      </mesh>
    </group>
  )
}



