import { useState } from 'react'
import './QuizModal.css'

const UI_TEXT = {
  en: { title: 'Before You Sign', sub: 'Please read and check each point to confirm you understand.', close: 'Close', confirm: 'I Understand' },
  es: { title: 'Antes de Firmar', sub: 'Lea y marque cada punto para confirmar que entiende.', close: 'Cerrar', confirm: 'Entiendo' },
  fr: { title: 'Avant de Signer', sub: 'Veuillez lire et cocher chaque point pour confirmer votre compréhension.', close: 'Fermer', confirm: 'Je Comprends' },
  de: { title: 'Vor dem Unterschreiben', sub: 'Bitte lesen und bestätigen Sie jeden Punkt.', close: 'Schließen', confirm: 'Ich Verstehe' },
  pt: { title: 'Antes de Assinar', sub: 'Leia e marque cada ponto para confirmar que entende.', close: 'Fechar', confirm: 'Eu Entendo' },
  it: { title: 'Prima di Firmare', sub: 'Legga e spunti ogni punto per confermare la comprensione.', close: 'Chiudi', confirm: 'Ho Capito' },
  pl: { title: 'Przed Podpisaniem', sub: 'Przeczytaj i zaznacz każdy punkt, aby potwierdzić zrozumienie.', close: 'Zamknij', confirm: 'Rozumiem' },
  hi: { title: 'हस्ताक्षर से पहले', sub: 'प्रत्येक बिंदु पढ़ें और समझ की पुष्टि करने के लिए चेक करें।', close: 'बंद करें', confirm: 'मैं समझता हूँ' },
}

const FALLBACK_POINTS = [
  'You are giving permission for a medical procedure to be performed on you.',
  'All medical procedures carry some risk, including rare but serious complications.',
  'You have the right to ask questions and have them answered before signing.',
  'You can withdraw your consent at any time before the procedure begins.',
  'Signing this form means you have been informed and agree to proceed.',
]

export default function QuizModal({ keyPoints = [], language = 'en', onClose, onComplete }) {
  const ui = UI_TEXT[language] || UI_TEXT.en
  const points = (keyPoints.length > 0 ? keyPoints : FALLBACK_POINTS)
    .map(p => p.replace(/__/g, ''))
  const [checked, setChecked] = useState(() => new Array(points.length).fill(false))

  const allChecked = checked.every(Boolean)

  const toggle = (i) => {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3 className="modal-title">{ui.title}</h3>
        <p className="modal-sub">{ui.sub}</p>

        <div className="modal-body">
          {points.map((point, i) => (
            <div
              key={i}
              className={`key-point ${checked[i] ? 'key-point-checked' : ''}`}
              onClick={() => toggle(i)}
            >
              <span className="key-point-checkbox">
                {checked[i] ? '✓' : ''}
              </span>
              <span className="key-point-text">{point}</span>
            </div>
          ))}
        </div>

        <div className="modal-btn-row">
          <button className="modal-btn" onClick={onClose}>{ui.close}</button>
          <button
            className="modal-btn modal-btn-primary"
            disabled={!allChecked}
            onClick={onComplete}
          >
            {ui.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
