import { Routes, Route } from 'react-router-dom'
import Introduction from './pages/Introduction'
import Quiz from './pages/Quiz'
import Finale from './pages/Finale'
import './App.css'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Introduction />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/finale" element={<Finale />} />
      </Routes>
    </div>
  )
}

export default App



