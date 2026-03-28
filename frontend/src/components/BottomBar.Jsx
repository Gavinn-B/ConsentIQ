import './BottomBar.css'

export default function BottomBar({ progress, quizComplete, onOpenQuiz }) {
  return (
    <div className="bottom-bar">
      <div className="quiz-section">
        <div className="quiz-label">Comprehension Quiz completion</div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="btn-area">
        <button
          className={`btn btn-quiz ${quizComplete ? 'btn-quiz-done' : ''}`}
          onClick={!quizComplete ? onOpenQuiz : undefined}
          disabled={quizComplete}
        >
          {quizComplete ? 'Quiz Complete ✓' : 'Take Comprehension Quiz'}
        </button>

        <button
          className={`btn btn-sign ${quizComplete ? 'btn-sign-active' : ''}`}
          disabled={!quizComplete}
          onClick={() => quizComplete && alert('Consent signed and recorded.')}
        >
          Sign &amp; Confirm
        </button>
      </div>
    </div>
  )
}
