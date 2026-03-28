import { useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href

import TopBar from './components/TopBar'
import ConsentPanel from './components/ConsentPanel'
import BottomBar from './components/BottomBar'
import QuizModal from './components/QuizModal'
import jargonMap from './jargonMap'
import './App.css'

export default function App() {
  const [language, setLanguage] = useState('en')
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [progress, setProgress] = useState(30)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [aiContent, setAiContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState(null)

  const plainText = aiContent?.plain || null
  const currentJargon = aiContent?.jargon || jargonMap[language] || jargonMap['en']

  const handleFileUpload = async (file) => {
    setLoading(true)
    setFileName(file.name)
    setPdfUrl(URL.createObjectURL(file))

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let rawText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        rawText += content.items.map(item => item.str).join(' ') + '\n'
      }

      setStatusMsg('Sending to server...')
      const res = await fetch('http://localhost:3000/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      })
      const data = await res.json()
      if (data.plain) {
        setAiContent(data)
        setStatusMsg(null)
      } else if (data.error) {
        setStatusMsg(`Server error: ${data.error}`)
      } else {
        setStatusMsg(`Unexpected response. Keys: ${Object.keys(data).join(', ')}`)
      }
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`)
      console.error('Failed to parse or contact backend:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleQuizComplete = () => {
    setQuizComplete(true)
    setProgress(100)
    setQuizOpen(false)
  }

  const handleSpeak = () => {
    if (!plainText) return
    const text = plainText.join(' ').replace(/__([^_]+)__/g, '$1')
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="app">
      <TopBar
        language={language}
        onLanguageChange={setLanguage}
        onSpeak={handleSpeak}
      />

      <div className="panels">
        {pdfUrl ? (
          <div className="pdf-panel">
            <div className="pdf-panel-header">
              <span className="pdf-panel-title">{fileName}</span>
              <label className="swap-btn">
                Replace PDF
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
            </div>
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              className="pdf-embed"
              title="Consent Form"
            />
          </div>
        ) : (
          <div className="upload-panel">
            <div className="upload-zone">
              <div className="upload-icon">&#128196;</div>
              <p className="upload-heading">Upload a Consent Form</p>
              <p className="upload-sub">Upload a PDF to view the legal document and receive a plain-language summary</p>
              <label className="upload-btn">
                {loading ? 'Processing...' : 'Choose PDF'}
                <input
                  type="file"
                  accept=".pdf"
                  disabled={loading}
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                />
              </label>
            </div>
          </div>
        )}

        <div className="divider" />

        {plainText ? (
          <ConsentPanel
            title="Plain English"
            paragraphs={plainText}
            jargonData={currentJargon}
            isPlain={true}
          />
        ) : (
          <div className="upload-panel">
            <div className="upload-zone muted">
              <div className="upload-icon">&#129302;</div>
              <p className="upload-heading">Simplified Summary</p>
              <p className="upload-sub">
                {loading
                  ? 'Processing your document...'
                  : pdfUrl
                  ? 'Waiting for AI to process the document...'
                  : 'Upload a document on the left to see the plain-language version here'}
              </p>
              {statusMsg && <p className="status-msg">{statusMsg}</p>}
            </div>
          </div>
        )}
      </div>

      <BottomBar
        progress={progress}
        quizComplete={quizComplete}
        onOpenQuiz={() => setQuizOpen(true)}
      />
      {quizOpen && (
        <QuizModal
          onClose={() => setQuizOpen(false)}
          onComplete={handleQuizComplete}
        />
      )}
    </div>
  )
}
