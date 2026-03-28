import { useState } from 'react'
import './ConsentPanel.css'

function parseParagraph(text, jargonData, openPopup, activePopup) {
  if (!jargonData || Object.keys(jargonData).length === 0) {
    return <p className="panel-text">{text}</p>
  }

  const terms = Object.keys(jargonData)
  const regex = new RegExp(`__(${terms.join('|')})__`, 'gi')
  const parts = text.split(regex)

  return (
    <p className="panel-text">
      {parts.map((part, i) => {
        const matched = terms.find(t => t.toLowerCase() === part.toLowerCase())
        if (matched) {
          const popupId = `${matched}-${i}`
          const entry = jargonData[matched]
          return (
            <span key={i} className="highlight-wrap">
              <span
                className="highlight"
                onClick={() => openPopup(activePopup === popupId ? null : popupId)}
              >
                {part}
              </span>
              {activePopup === popupId && (
                <span className="popup">
                  <span className="popup-term">{entry.translated}</span>
                  <span className="popup-def">{entry.definition}</span>
                </span>
              )}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}

export default function ConsentPanel({ title, paragraphs, jargonData, isPlain }) {
  const [activePopup, setActivePopup] = useState(null)

  return (
    <div className={`panel ${isPlain ? 'panel-plain' : ''}`} onClick={(e) => {
      if (!e.target.closest('.highlight')) setActivePopup(null)
    }}>
      <h2 className="panel-title">{title}</h2>
      {paragraphs.map((para, i) => (
        <div key={i}>
          {parseParagraph(para, jargonData, setActivePopup, activePopup)}
        </div>
      ))}
    </div>
  )
}