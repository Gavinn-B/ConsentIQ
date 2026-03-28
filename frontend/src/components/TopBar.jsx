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

export default function TopBar({ language, onLanguageChange, onSpeak }) {
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

      <button className="speaker-btn" onClick={onSpeak} title="Read aloud">
        &#128266;
      </button>
    </div>
  )
}