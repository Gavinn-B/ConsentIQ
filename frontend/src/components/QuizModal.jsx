import { useState } from 'react'
import './QuizModal.css'

const questions = [
  {
    question: 'What surgery are you consenting to?',
    options: [
      'Removal of your gallbladder using small cuts',
      'Heart bypass surgery',
      'Knee replacement surgery'
    ],
    correct: 0
  }
]

export default function QuizModal({ onClose, onComplete }) {
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)

  const handleAnswer = (index) => {
    if (answered) return
    setSelected(index)
    setAnswered(true)
  }

  const getOptionClass = (index) => {
    if (!answered) return 'option'
    if (index === questions[0].correct) return 'option option-correct'
    if (index === selected && index !== questions[0].correct) return 'option option-wrong'
    return 'option'
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 className="modal-title">Comprehension Check</h3>
        <p className="modal-sub">
          {answered
            ? selected === questions[0].correct
              ? 'Correct! You may now sign.'
              : 'The correct answer is highlighted.'
            : 'Answer correctly to unlock your signature.'}
        </p>

        <div className="modal-body">
          <p className="question">{questions[0].question}</p>
          {questions[0].options.map((opt, i) => (
            <div
              key={i}
              className={getOptionClass(i)}
              onClick={() => handleAnswer(i)}
            >
              {opt}
            </div>
          ))}
        </div>

        <div className="modal-btn-row">
          <button className="modal-btn" onClick={onClose}>Close</button>
          {answered && (
            <button className="modal-btn modal-btn-primary" onClick={onComplete}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
