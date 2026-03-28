import './TopBar.css'

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

const SPEECH_ICONS = {
  idle:     { icon: '🔊', title: 'Read aloud' },
  speaking: { icon: '⏸', title: 'Pause' },
  paused:   { icon: '▶', title: 'Resume' },
}

export default function TopBar({ language, onLanguageChange, onSpeak, speechState = 'idle' }) {
  const { icon, title } = SPEECH_ICONS[speechState] || SPEECH_ICONS.idle

  return (
    <div className="topbar">
      <div className="logo">
        <span className="logo-clear">Clear</span>
        <span className="logo-consent">Consent</span>
      </div>

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

      <button className="speaker-btn" onClick={onSpeak} title={title}>
        {icon}
      </button>
    </div>
  )
}