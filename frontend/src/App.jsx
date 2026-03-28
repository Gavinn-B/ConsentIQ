import { useState } from 'react'
import TopBar from './components/TopBar'
import ConsentPanel from './components/ConsentPanel'
import BottomBar from './components/BottomBar'
import QuizModal from './components/QuizModal'
import './App.css'

const legalText = [
  `I AM "MEDICAL CONSENT" (AGENT), hereby providing informed consent to and authorizing surgeons to perform the procedure in the coordination of the operation of laparoscopic cholecystectomy, and the type of surgery necessary to remove your gallbladder using small cuts in your belly, it being in the patient's medical interest and there being a great possibility of comprehension.`,
  `I immediately allow the aforementioned pleasantries by a type of surgery or vertroronicals, canvass for a formal accreditation copy of gallbladder, and patient signatures of the phone merits, inspection, consent and project confirmation for all parties involved.`,
  `A laparoscopic cholecystectomy is an underperformance of surgery, laparoscopic access by applying the surgeon's personalized governmental medicine, whether patient to entangle or notwithstanding medical, subject to all applicable laws and standards of clinical inculcation.`
]

const plainText = [
  `I am supposed to be an important form for your permission before surgery to remove your gallbladder using small cuts in your belly.`,
  `__laparoscopic cholecystectomy__ is a type of surgery to remove your gallbladder using small cuts in your belly. You understand that your surgeon will perform __general anesthesia__ during the procedure. This means you will be fully asleep and will not feel any pain.`,
  `A laparoscopic cholecystectomy is a common and routine surgery to remove your gallbladder using small cuts in your belly.`
]

const jargonMap = {
  'laparoscopic cholecystectomy': 'A type of surgery to remove your gallbladder using small cuts in your belly with a tiny camera.',
  'general anesthesia': 'Medicine that puts you in a deep sleep so you feel no pain during surgery.'
}

export default function App() {
  const [language, setLanguage] = useState('en')
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [progress, setProgress] = useState(30)

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
          paragraphs={legalText}
          jargonMap={{}}
        />
        <div className="divider" />
        <ConsentPanel
          title="Plain English"
          paragraphs={plainText}
          jargonMap={jargonMap}
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
