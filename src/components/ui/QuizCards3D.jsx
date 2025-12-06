import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { QuizCard3D } from './QuizCard3D'

const SPHERE_RADIUS = 9
const ROTATION_SPEED_Y = 0.0005

export function QuizCards3D({ 
  questions, 
  answeredCards, 
  onCardClick, 
  getDifficultyColor
}) {
  const groupRef = useRef(null)

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

  // Вращение группы карточек
  useFrame(() => {
    if (groupRef.current) {
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
          />
        )
      })}
    </group>
  )
}

