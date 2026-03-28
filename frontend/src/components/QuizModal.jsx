import { useState } from 'react'
import './QuizModal.css'

// Translated UI strings for all supported languages
const UI_TEXT = {
  en: { title: 'Before You Sign', sub: 'Please read and check each point to confirm you understand.', close: 'Close', confirm: 'I Understand', signed: 'You have now signed and confirmed.', ratingLabel: 'How would you rate your experience?', done: 'Done' },
  es: { title: 'Antes de Firmar', sub: 'Lea y marque cada punto para confirmar que entiende.', close: 'Cerrar', confirm: 'Entiendo', signed: 'Ha firmado y confirmado.', ratingLabel: '¿Cómo calificaría su experiencia?', done: 'Listo' },
  fr: { title: 'Avant de Signer', sub: 'Veuillez lire et cocher chaque point pour confirmer votre compréhension.', close: 'Fermer', confirm: 'Je Comprends', signed: 'Vous avez signé et confirmé.', ratingLabel: 'Comment évalueriez-vous votre expérience ?', done: 'Terminé' },
  de: { title: 'Vor dem Unterschreiben', sub: 'Bitte lesen und bestätigen Sie jeden Punkt.', close: 'Schließen', confirm: 'Ich Verstehe', signed: 'Sie haben jetzt unterschrieben und bestätigt.', ratingLabel: 'Wie würden Sie Ihre Erfahrung bewerten?', done: 'Fertig' },
  pt: { title: 'Antes de Assinar', sub: 'Leia e marque cada ponto para confirmar que entende.', close: 'Fechar', confirm: 'Eu Entendo', signed: 'Você assinou e confirmou.', ratingLabel: 'Como você avaliaria sua experiência?', done: 'Concluído' },
  it: { title: 'Prima di Firmare', sub: 'Legga e spunti ogni punto per confermare la comprensione.', close: 'Chiudi', confirm: 'Ho Capito', signed: 'Hai firmato e confermato.', ratingLabel: 'Come valuteresti la tua esperienza?', done: 'Fatto' },
  pl: { title: 'Przed Podpisaniem', sub: 'Przeczytaj i zaznacz każdy punkt, aby potwierdzić zrozumienie.', close: 'Zamknij', confirm: 'Rozumiem', signed: 'Podpisałeś i potwierdziłeś.', ratingLabel: 'Jak oceniasz swoje doświadczenie?', done: 'Gotowe' },
  hi: { title: 'हस्ताक्षर से पहले', sub: 'प्रत्येक बिंदु पढ़ें और समझ की पुष्टि करने के लिए चेक करें।', close: 'बंद करें', confirm: 'मैं समझता हूँ', signed: 'आपने अब हस्ताक्षर और पुष्टि कर दी है।', ratingLabel: 'आप अपने अनुभव को कैसे रेट करेंगे?', done: 'हो गया' },
}

// Fallback key points used if the AI doesn't return any
const FALLBACK_POINTS = [
  'You are giving permission for a medical procedure to be performed on you.',
  'All medical procedures carry some risk, including rare but serious complications.',
  'You have the right to ask questions and have them answered before signing.',
  'You can withdraw your consent at any time before the procedure begins.',
  'Signing this form means you have been informed and agree to proceed.',
]

export default function QuizModal({ keyPoints = [], language = 'en', onClose, onComplete, alreadySigned = false }) {
  const ui = UI_TEXT[language] || UI_TEXT.en

  // Strip __ markers that Gemini sometimes wraps around jargon terms in key points
  const points = (keyPoints.length > 0 ? keyPoints : FALLBACK_POINTS)
    .map(p => p.replace(/__/g, ''))

  const [checked, setChecked] = useState(() => new Array(points.length).fill(false))
  const [signed, setSigned] = useState(alreadySigned) // Skip checklist if already signed
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)

  const allChecked = checked.every(Boolean)

  const toggle = (i) => {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v))
  }

  // Mark as signed and notify parent to update progress
  const handleConfirm = () => {
    setSigned(true)
    onComplete()
  }

  const handleDone = () => {
    onClose()
  }

  // Confirmation screen — shown after signing or when re-opening after completion
  if (signed) {
    return (
      <div className="modal-overlay">
        <div className="modal modal-confirmation">
          <div className="confirm-checkmark">✓</div>
          <p className="confirm-signed">{ui.signed}</p>

          {/* 1–5 star experience rating — hover previews, click to select */}
          <div className="rating-section">
            <p className="rating-label">{ui.ratingLabel}</p>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  className={`star-btn ${star <= (hovered || rating) ? 'star-filled' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <button className="modal-btn modal-btn-primary confirm-done-btn" onClick={handleDone}>
            {ui.done}
          </button>
        </div>
      </div>
    )
  }

  // Checklist screen — all points must be checked before confirming
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
          {/* Confirm button stays disabled until every point is checked */}
          <button
            className="modal-btn modal-btn-primary"
            disabled={!allChecked}
            onClick={handleConfirm}
          >
            {ui.confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
