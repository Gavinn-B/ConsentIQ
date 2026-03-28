import { useState } from 'react'
import TopBar from './components/TopBar'
import ConsentPanel from './components/ConsentPanel'
import BottomBar from './components/BottomBar'
import QuizModal from './components/QuizModal'
import consentContent from './consentContent'
import jargonMap from './jargonMap'
import './App.css'

export default function App() {
  const [language, setLanguage] = useState('en')
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [progress, setProgress] = useState(30)

  const content = consentContent[language] || consentContent['en']
  const plainText = content.plain
  const currentJargon = jargonMap[language] || jargonMap['en']

  const handleQuizComplete = () => {
    setQuizComplete(true)
    setProgress(100)
    setQuizOpen(false)
  }

  const handleSpeak = () => {
    const text = plainText.join(' ').replace(/__([^_]+)__/g, '$1')
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="app">
      <TopBar
        language={language}
        onLanguageChange={setLanguage}
        onSpeak={handleSpeak}
      />
      <div className="panels">
        <ConsentPanel
          title="Legal Form"
          paragraphs={consentContent['en'].legal}
          jargonData={{}}
        />
        <div className="divider" />
        <ConsentPanel
          title="Plain English"
          paragraphs={plainText}
          jargonData={currentJargon}
          isPlain={true}
        />
      </div>
      <BottomBar
        progress={progress}
        quizComplete={quizComplete}
        onOpenQuiz={() => setQuizOpen(true)}
      />
      {quizOpen && (
        <QuizModal
          onClose={() => setQuizOpen(false)}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  )
}