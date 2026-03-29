import { useState, useEffect, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href

import TopBar from './components/TopBar'
import ConsentPanel from './components/ConsentPanel'
import BottomBar from './components/BottomBar'
import QuizModal from './components/QuizModal'
import './App.css'

// Streams simplified sections from the server as Gemini generates them.
// Calls onSection(section) for each plain section as it arrives,
// then onDone({ jargon, keyPoints }) when the full response is complete.
async function callServerStream(rawText, language, onSection, onDone, onError) {
  const res = await fetch('http://localhost:3000/api/simplify-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: rawText, language }),
  })

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let lineBuffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    lineBuffer += decoder.decode(value, { stream: true })
    const lines = lineBuffer.split('\n')
    lineBuffer = lines.pop() // hold incomplete line for next chunk

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const event = JSON.parse(line.slice(6))
        if (event.type === 'section') onSection(event.section)
        else if (event.type === 'done') onDone(event)
        else if (event.type === 'error') onError(event.error)
      } catch { /* malformed SSE line — skip */ }
    }
  }
}

export default function App() {
  // --- Global state ---
  const [language, setLanguage] = useState('en')
  const [quizOpen, setQuizOpen] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [progress, setProgress] = useState(30)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [rawText, setRawText] = useState(null)
  const [aiContent, setAiContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState(null)
  const [speechState, setSpeechState] = useState('idle') // 'idle' | 'speaking' | 'paused'

  const prevLanguage = useRef('en')
  const audioRef = useRef(null)           // Holds the main TTS Audio object
  const mainWasPlayingRef = useRef(false) // Tracks if main audio was playing when a popup opened

  const plainText = aiContent?.plain || null
  const currentJargon = aiContent?.jargon || null

  // Re-translate the document whenever the language changes (only if a PDF has been processed)
  useEffect(() => {
    if (!rawText || language === prevLanguage.current) return
    prevLanguage.current = language

    // Defer initial state updates out of the synchronous effect body to satisfy the linter
    setTimeout(() => {
      setLoading(true)
      setStatusMsg('Translating...')
      setAiContent(null)
    }, 0)

    const sections = []
    callServerStream(
      rawText,
      language,
      (section) => {
        sections.push(section)
        // Show sections as they stream in; hide the loading overlay on first section
        setLoading(false)
        setStatusMsg(null)
        setAiContent(prev => ({ ...prev, plain: [...sections] }))
      },
      ({ jargon, keyPoints }) => {
        setAiContent(prev => ({ ...prev, jargon, keyPoints }))
        setLoading(false)
        setStatusMsg(null)
      },
      (err) => {
        setStatusMsg(`Error: ${err}`)
        setLoading(false)
      }
    )
  }, [language, rawText])

  // Extracts text from the uploaded PDF using PDF.js, then streams it to the server
  const handleFileUpload = async (file) => {
    setLoading(true)
    setFileName(file.name)
    setPdfUrl(URL.createObjectURL(file))
    setAiContent(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map(item => item.str).join(' ') + '\n'
      }

      setRawText(text)
      setStatusMsg('Sending to server...')

      const sections = []
      await callServerStream(
        text,
        language,
        (section) => {
          sections.push(section)
          // Render first section immediately — hides the loading state
          setLoading(false)
          setStatusMsg(null)
          setAiContent(prev => ({ ...prev, plain: [...sections] }))
        },
        ({ jargon, keyPoints }) => {
          setAiContent(prev => ({ ...prev, jargon, keyPoints }))
        },
        (err) => {
          setStatusMsg(`Error: ${err}`)
          setLoading(false)
        }
      )
    } catch (err) {
      setStatusMsg(`Error: ${err.message}`)
      console.error('Failed to parse or contact backend:', err)
      setLoading(false)
    }
  }

  const handleQuizComplete = () => {
    setQuizComplete(true)
    setProgress(100)
    setQuizOpen(false)
  }

  // --- Popup / main audio coordination ---
  // Pauses main TTS when a jargon popup is opened, so both don't play at once
  const handlePauseForPopup = () => {
    if (speechState === 'speaking') {
      audioRef.current?.pause()
      setSpeechState('paused')
      mainWasPlayingRef.current = true
    } else {
      mainWasPlayingRef.current = false
    }
  }

  // Resumes main TTS when the popup is closed, if it was playing before
  const handlePopupClose = () => {
    if (mainWasPlayingRef.current && audioRef.current) {
      audioRef.current.play()
      setSpeechState('speaking')
    }
    mainWasPlayingRef.current = false
  }

  // Fetches TTS audio for a single term+definition from ElevenLabs.
  // Returns the Audio object so the popup can own and control playback (pause/resume).
  const handleSpeakWord = async (term, definition) => {
    const defText = typeof definition === 'object' ? definition.definition : definition
    const text = `${term}. ${defText}`
    try {
      const res = await fetch('http://localhost:3000/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      return audio
    } catch (err) {
      console.error('Word TTS failed:', err)
      return null
    }
  }

  // Handles play/pause/resume for the full document read-aloud via ElevenLabs
  const handleSpeak = async () => {
    if (speechState === 'speaking') {
      audioRef.current?.pause()
      setSpeechState('paused')
      return
    }

    if (speechState === 'paused') {
      audioRef.current?.play()
      setSpeechState('speaking')
      return
    }

    if (!plainText) return

    // Strip formatting markers before sending to TTS.
    // Skip patient info sections — names, IDs, and DOBs don't need to be read aloud.
    const text = plainText
      .filter(s => {
        const title = (typeof s === 'object' ? s.title : '') || ''
        return !/(patient\s*information|patient\s*info)/i.test(title)
      })
      .map(s => {
        if (typeof s === 'object') {
          const body = (s.text || '')
            .replace(/\*\s*/g, '')
            .replace(/__([^_]+)__/g, '$1')
          return s.title ? `${s.title}. ${body}` : body
        }
        return s.replace(/\*\s*/g, '').replace(/__([^_]+)__/g, '$1')
      })
      .join('. ')

    setSpeechState('speaking')

    try {
      const res = await fetch('http://localhost:3000/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }

      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => setSpeechState('idle')
      audio.play()
    } catch (err) {
      console.error('ElevenLabs TTS failed:', err)
      setSpeechState('idle')
    }
  }

  return (
    <div className="app">
      <TopBar
        language={language}
        onLanguageChange={setLanguage}
        onSpeak={handleSpeak}
        speechState={speechState}
      />

      <div className="panels">
        {/* Left panel: PDF viewer or upload prompt */}
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

        {/* Right panel: AI-simplified consent text or placeholder */}
        {plainText ? (
          <div className="right-pane">
            <ConsentPanel
              title="Plain Language Summary"
              paragraphs={plainText}
              jargonData={currentJargon}
              isPlain={true}
              loading={loading}
              onPopupOpen={handlePauseForPopup}
              onPopupClose={handlePopupClose}
              onSpeakWord={handleSpeakWord}
            />
          </div>
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
        onSign={() => setQuizOpen(true)}
        language={language}
      />

      {/* Quiz modal — re-opens to the confirmation screen if already signed */}
      {quizOpen && (
        <QuizModal
          keyPoints={aiContent?.keyPoints || []}
          language={language}
          onClose={() => setQuizOpen(false)}
          onComplete={handleQuizComplete}
          alreadySigned={quizComplete}
        />
      )}
    </div>
  )
}
