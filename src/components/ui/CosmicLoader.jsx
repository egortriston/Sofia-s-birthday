import './CosmicLoader.css'

export function CosmicLoader({ message = 'Загрузка космических карточек...' }) {
  return (
    <div className="cosmic-loader-container">
      <div className="cosmic-loader">
        {/* Центральная планета */}
        <div className="planet">
          <div className="planet-core"></div>
          <div className="planet-ring"></div>
        </div>
        
        {/* Орбитальные частицы */}
        <div className="orbit orbit-1">
          <div className="particle particle-1"></div>
        </div>
        <div className="orbit orbit-2">
          <div className="particle particle-2"></div>
        </div>
        <div className="orbit orbit-3">
          <div className="particle particle-3"></div>
        </div>
        
        {/* Звезды на фоне */}
        <div className="stars">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="star" 
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            ></div>
          ))}
        </div>
      </div>
      <p className="cosmic-loader-text">{message}</p>
    </div>
  )
}

