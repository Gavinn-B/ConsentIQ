import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './ConsentPanel.css'

// Icon map for the listen button inside the jargon popup
const LISTEN_ICONS = {
  idle:     '🔊',
  loading:  '…',
  speaking: '⏸',
  paused:   '▶',
}

// Popup rendered via portal so it escapes overflow-hidden containers.
// Positioned directly below the clicked term, clamped to viewport width.
function Popup({ term, definition, anchorEl, onClose, onSpeakWord }) {
  const popupRef = useRef(null)
  const popupAudioRef = useRef(null) // Audio object owned by this popup instance
  const [listenState, setListenState] = useState('idle')

  const pos = (() => {
    if (!anchorEl) return { top: 0, left: 0 }
    const rect = anchorEl.getBoundingClientRect()
    const popupWidth = 260
    let left = rect.left
    let top = rect.bottom + 8
    if (left + popupWidth > window.innerWidth - 12) {
      left = window.innerWidth - popupWidth - 12
    }
    return { top, left }
  })()

  // Pause popup audio when the popup unmounts
  useEffect(() => {
    return () => {
      popupAudioRef.current?.pause()
    }
  }, [])

  // Close popup on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  // Definition can be a plain string or an object with { definition, translation }
  const isObject = typeof definition === 'object'
  const translatedTerm = isObject ? definition.translation : null
  const definitionText = isObject ? definition.definition : definition

  // Handles play/pause/resume for the popup's own TTS audio
  const handleListen = async () => {
    if (listenState === 'speaking') {
      popupAudioRef.current?.pause()
      setListenState('paused')
      return
    }
    if (listenState === 'paused') {
      popupAudioRef.current?.play()
      setListenState('speaking')
      return
    }
    if (listenState === 'loading') return

    setListenState('loading')
    const audio = await onSpeakWord(term, definition)
    if (!audio) { setListenState('idle'); return }

    popupAudioRef.current = audio
    audio.onended = () => setListenState('idle')
    audio.play()
    setListenState('speaking')
  }

  return createPortal(
    <div ref={popupRef} className="popup" style={{ top: pos.top, left: pos.left }}>
      <div className="popup-header">
        <span className="popup-term">{term}</span>
        <button
          className={`popup-listen-btn ${listenState !== 'idle' ? 'popup-listen-btn-active' : ''}`}
          onClick={handleListen}
          title="Listen"
        >
          {LISTEN_ICONS[listenState]}
        </button>
      </div>
      {/* Show translated term only if it differs from the English term */}
      {translatedTerm && translatedTerm.toLowerCase() !== term.toLowerCase() && (
        <span className="popup-translation">{translatedTerm}</span>
      )}
      <span className="popup-def">{definitionText}</span>
    </div>,
    document.body
  )
}

// Renders a single text segment, splitting on __term__ markers.
// Terms found in jargonData are rendered as clickable highlights.
function renderSegment(text, jargonData, onHighlightClick, activePopup, segIndex) {
  const parts = text.split(/__(.*?)__/g)

  return parts.map((part, i) => {
    if (i % 2 === 1) {
      // Odd indices are the captured jargon terms between __ markers
      const entry = jargonData
        ? Object.entries(jargonData).find(
            ([key]) => key.toLowerCase() === part.toLowerCase()
          )
        : null
      const definition = entry?.[1]
      const popupId = `${part}-${segIndex}-${i}`

      return (
        <span key={i} className="highlight-wrap">
          <span
            className={`highlight ${definition ? 'highlight-clickable' : ''}`}
            onClick={(e) => {
              if (!definition) return
              onHighlightClick(activePopup?.id === popupId ? null : { id: popupId, term: part, definition, el: e.currentTarget })
            }}
          >
            {part}
          </span>
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

// Renders a section's text as either a bullet list (if it starts with *)
// or a plain paragraph, with jargon terms highlighted inline.
function renderText(text, jargonData, onHighlightClick, activePopup, sectionIndex) {
  const trimmed = text.trim()

  if (trimmed.startsWith('*')) {
    const items = trimmed.split(/\n?\s*\*\s+/).filter(Boolean)
    return (
      <ul className="panel-list">
        {items.map((item, i) => (
          <li key={i} className="panel-list-item">
            {renderSegment(item.trim(), jargonData, onHighlightClick, activePopup, `${sectionIndex}-${i}`)}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <p className="panel-text">
      {renderSegment(trimmed, jargonData, onHighlightClick, activePopup, sectionIndex)}
    </p>
  )
}

export default function ConsentPanel({ title, paragraphs, jargonData, isPlain, loading, onPopupOpen, onPopupClose, onSpeakWord }) {
  const [activePopup, setActivePopup] = useState(null)

  // Opening a popup notifies App to pause main TTS; closing resumes it
  const handleHighlightClick = (popup) => {
    if (popup && onPopupOpen) onPopupOpen()
    if (!popup && onPopupClose) onPopupClose()
    setActivePopup(popup)
  }

  const handlePopupClose = () => {
    if (onPopupClose) onPopupClose()
    setActivePopup(null)
  }

  return (
    <div className={`panel ${isPlain ? 'panel-plain' : ''}`}>
      {loading && <div className="panel-loading">Translating...</div>}
      <h2 className="panel-title">{title}</h2>

      <div className="panel-body">
        {paragraphs.map((section, i) => {
          // Sections can be objects with { title, text } or plain strings
          if (section && typeof section === 'object' && section.title) {
            return (
              <div key={i} className="panel-section">
                <h3 className="section-title">{section.title}</h3>
                {renderText(section.text || '', jargonData, handleHighlightClick, activePopup, i)}
              </div>
            )
          }
          return (
            <div key={i}>
              {renderText(typeof section === 'string' ? section : '', jargonData, handleHighlightClick, activePopup, i)}
            </div>
          )
        })}
      </div>

      {activePopup && (
        <Popup
          term={activePopup.term}
          definition={activePopup.definition}
          anchorEl={activePopup.el}
          onClose={handlePopupClose}
          onSpeakWord={onSpeakWord}
        />
      )}
    </div>
  )
}
