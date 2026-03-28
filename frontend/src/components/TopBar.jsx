import './TopBar.css'

export default function TopBar({ isEnglish, onToggle, onSpeak }) {
  return (
    <div className="topbar">
      <div className="logo">
        <span className="logo-clear">Clear</span>
        <span className="logo-consent">Consent</span>
      </div>

      <div className="toggle-area">
        <span className="toggle-label">Toggle</span>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isEnglish}
            onChange={onToggle}
          />
          <span className="slider" />
        </label>
        <span className="toggle-label">English</span>
      </div>

      <button className="speaker-btn" onClick={onSpeak} title="Read aloud">
        &#128266;
      </button>
    </div>
  )
}
