import { useMemo, useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { QuizCard3D } from './QuizCard3D'

const SPHERE_RADIUS = 11.5
const ROTATION_SPEED_Y = 0.0004

export function QuizCards3D({ 
  questions, 
  answeredCards, 
  onCardClick, 
  getDifficultyColor,
  onAllCardsLoaded
}) {
  const groupRef = useRef(null)
  const isInteractingRef = useRef(false)
  const [loadedCards, setLoadedCards] = useState(0)
  const totalCards = questions.length

  // Отслеживаем загрузку всех карточек
  useEffect(() => {
    if (loadedCards === totalCards && onAllCardsLoaded) {
      // Небольшая задержка для плавного появления
      setTimeout(() => {
        onAllCardsLoaded()
      }, 300)
    }
  }, [loadedCards, totalCards, onAllCardsLoaded])

  // Вычисляем начальное вращение, чтобы первая карточка была видна
  // Если 9-я карточка сейчас видна первой, нужно повернуть группу так, чтобы первая была видна
  const initialRotation = useMemo(() => {
    const count = questions.length
    // Угол 9-й карточки (index 8)
    const card9Angle = (8 / count) * Math.PI * 2
    // Поворачиваем группу так, чтобы первая карточка была там, где сейчас 9-я
    // Нужно повернуть на отрицательный угол 9-й карточки
    return -card9Angle
  }, [questions.length])

  const cardPositions = useMemo(() => {
    const positions = []
    const count = questions.length

    // Распределяем карточки по кругу вокруг сферы (как orbitingImages)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const x = SPHERE_RADIUS * Math.cos(angle)
      const y = 0 // Все на одном уровне, можно варьировать
      const z = SPHERE_RADIUS * Math.sin(angle)

      const position = new THREE.Vector3(x, y, z)
      const center = new THREE.Vector3(0, 0, 0)
      const outwardDirection = position.clone().sub(center).normalize()

      const euler = new THREE.Euler()
      const matrix = new THREE.Matrix4()
      matrix.lookAt(
        position,
        position.clone().add(outwardDirection),
        new THREE.Vector3(0, 1, 0)
      )
      euler.setFromRotationMatrix(matrix)
      euler.z += Math.PI

      positions.push({
        position: [x, y, z],
        rotation: [euler.x, euler.y, euler.z],
      })
    }

    return positions
  }, [questions.length])

  // Устанавливаем начальное вращение при монтировании
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = initialRotation
    }
  }, [initialRotation])

  // Вращение группы карточек (останавливается, когда пользователь наводит курсор на карточку)
  useFrame(() => {
    if (groupRef.current && !isInteractingRef.current) {
      groupRef.current.rotation.y += ROTATION_SPEED_Y
    }
  })

  return (
    <group ref={groupRef}>
      {questions.map((question, index) => {
        const isAnswered = answeredCards.has(question.id)
        const pos = cardPositions[index]

        return (
          <QuizCard3D
            key={question.id}
            question={question}
            position={pos.position}
            rotation={pos.rotation}
            isAnswered={isAnswered}
            difficultyColor={getDifficultyColor(question.difficulty)}
            onCardClick={() => onCardClick(question.id)}
            imageIndex={index}
            onPointerOverCard={() => { isInteractingRef.current = true }}
            onPointerOutCard={() => { isInteractingRef.current = false }}
            onLoad={() => setLoadedCards(prev => prev + 1)}
          />
        )
      })}
    </group>
  )
}

