import './TopBar.css'

// All supported languages available in the language selector
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'it', label: 'Italiano' },
  { code: 'pl', label: 'Polish' },
  { code: 'hi', label: 'Hindi' },
]

// Icon and tooltip for each TTS playback state
const SPEECH_ICONS = {
  idle:     { icon: '🔊', title: 'Read aloud' },
  speaking: { icon: '⏸', title: 'Pause' },
  paused:   { icon: '▶', title: 'Resume' },
}

export default function TopBar({ language, onLanguageChange, onSpeak, speechState = 'idle' }) {
  const { icon, title } = SPEECH_ICONS[speechState] || SPEECH_ICONS.idle

  return (
    <div className="topbar">
      {/* App branding */}
      <div className="logo">
        <span className="logo-clear">Consent</span>
        <span className="logo-consent">IQ</span>
      </div>

      {/* Language selector — triggers re-translation of the entire document */}
      <div className="lang-area">
        <span className="lang-label">Language</span>
        <select
          className="lang-select"
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Read-aloud button — icon and tooltip update based on current speech state */}
      <button className="speaker-btn" onClick={onSpeak} title={title}>
        {icon}
      </button>
    </div>
  )
}
