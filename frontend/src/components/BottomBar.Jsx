import './BottomBar.css'

const UI_TEXT = {
  en: { label: 'Comprehension Check', quiz: 'Take Comprehension Quiz', done: 'Quiz Complete ✓', sign: 'Sign & Confirm' },
  es: { label: 'Verificación de Comprensión', quiz: 'Tomar el Cuestionario', done: 'Cuestionario Completo ✓', sign: 'Firmar y Confirmar' },
  fr: { label: 'Vérification de Compréhension', quiz: 'Passer le Quiz', done: 'Quiz Terminé ✓', sign: 'Signer et Confirmer' },
  de: { label: 'Verständnisüberprüfung', quiz: 'Quiz Starten', done: 'Quiz Abgeschlossen ✓', sign: 'Unterschreiben & Bestätigen' },
  pt: { label: 'Verificação de Compreensão', quiz: 'Fazer o Questionário', done: 'Questionário Concluído ✓', sign: 'Assinar e Confirmar' },
  it: { label: 'Verifica della Comprensione', quiz: 'Inizia il Quiz', done: 'Quiz Completato ✓', sign: 'Firma e Conferma' },
  pl: { label: 'Sprawdzenie Rozumienia', quiz: 'Rozpocznij Quiz', done: 'Quiz Ukończony ✓', sign: 'Podpisz i Potwierdź' },
  hi: { label: 'समझ जांच', quiz: 'प्रश्नोत्तरी लें', done: 'प्रश्नोत्तरी पूर्ण ✓', sign: 'हस्ताक्षर करें और पुष्टि करें' },
}

export default function BottomBar({ progress, quizComplete, onOpenQuiz, onSign, language = 'en' }) {
  const ui = UI_TEXT[language] || UI_TEXT.en
  return (
    <div className="bottom-bar">
      <div className="quiz-section">
        <div className="quiz-label">{ui.label}</div>
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
          {quizComplete ? ui.done : ui.quiz}
        </button>

        <button
          className={`btn btn-sign ${quizComplete ? 'btn-sign-active' : ''}`}
          disabled={!quizComplete}
          onClick={onSign}
        >
          {ui.sign}
        </button>
      </div>
    </div>
  )
}
