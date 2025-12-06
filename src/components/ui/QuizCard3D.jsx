import { useRef, useState } from 'react'
import { Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import image21 from '../../images/2.1.jpg'
import image22 from '../../images/2.2.jpg'
import image23 from '../../images/2.3.jpg'
import image24 from '../../images/2.4.jpg'
import image25 from '../../images/2.5.jpg'
import image26 from '../../images/2.6.jpg'
import image27 from '../../images/2.7.jpg'
import image28 from '../../images/2.8.jpg'
import image29 from '../../images/2.9.jpg'
import image210 from '../../images/2.10.jpg'
import image211 from '../../images/2.11.jpg'
import image212 from '../../images/2.12.jpg'
import image213 from '../../images/2.13.jpg'
import image214 from '../../images/2.14.jpg'
import image215 from '../../images/2.15.jpg'
import image216 from '../../images/2.16.jpg'
import image217 from '../../images/2.17.jpg'
import image218 from '../../images/2.18.jpg'
import image219 from '../../images/2.19.jpg'
import image220 from '../../images/2.20.jpg'
import image221 from '../../images/2.21.jpg'

const CARD_IMAGE_SIZE = 1.5

// Массив всех изображений для карточек
const cardImages = [
  image21, image22, image23, image24, image25, image26, image27, image28, image29, image210,
  image211, image212, image213, image214, image215, image216, image217, image218, image219, image220, image221
]

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
  
  // Выбираем правильное изображение по индексу (imageIndex 0 = 2.1.jpg, imageIndex 1 = 2.2.jpg и т.д.)
  const selectedImage = cardImages[imageIndex] || cardImages[0]
  const texture = useTexture(selectedImage)
  
  // Настройка текстуры
  if (texture) {
    texture.wrapS = THREE.ClampToEdgeWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.flipY = false
  }

  const color = difficultyColor || '#60a5fa'

  return (
    <group position={position} rotation={rotation}>
      {/* Очень яркое свечение СЗАДИ карточки на всю фотку */}
      {!isAnswered && (
        <Html
          transform
          distanceFactor={0.6}
          position={[0, 0, -0.03]}
          style={{
            pointerEvents: 'none',
            width: `${CARD_IMAGE_SIZE * 600}px`,
            height: `${CARD_IMAGE_SIZE * 600}px`,
            overflow: 'visible',
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
            {/* Легкое размытое свечение цвета карточки по уровню сложности на всю фотку */}
            <div
              style={{
                position: 'absolute',
                width: '110%',
                height: '110%',
                background: `radial-gradient(circle, ${color}AA 0%, ${color}88 7%, ${color}66 20%, ${color}55 30%, ${color}44 45%, ${color}33 60%, ${color}22 80%, transparent 100%)`,
                filter: 'blur(70px)',
                borderRadius: '50%',
              }}
            />
          </div>
        </Html>
      )}
      
      {/* Легкое серое свечение СЗАДИ для отвеченных карточек */}
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
            {/* Простое размытое серое свечение */}
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(156, 163, 175, 0.25) 0%, rgba(156, 163, 175, 0.15) 30%, transparent 60%)',
                filter: 'blur(40px)',
                borderRadius: '50%',
              }}
            />
          </div>
        </Html>
      )}

      {/* Сама карточка с фотографией */}
      <mesh
        ref={meshRef}
        onPointerOver={() => {
          setHovered(true)
          if (!isAnswered) {
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
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

      </mesh>
    </group>
  )
}



