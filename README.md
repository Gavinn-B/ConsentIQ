# ConsentIQ

ConsentIQ is a healthcare accessibility tool that helps patients understand medical consent forms. It uses AI to convert complex legal and medical language into plain-language summaries, supports 8 languages, reads content aloud, and walks patients through a comprehension checklist before they sign.

![App Preview](frontend/src/assets/Video%20Project%208.gif)

---

## Features

- **PDF Upload & Display** — Upload a medical consent form PDF; the original is shown side-by-side with the simplified version
- **AI-Powered Simplification** — Google Gemini converts complex text into plain language, organized into labeled sections
- **Jargon Highlighting** — Medical terms are highlighted and clickable, showing a popup with a plain-language definition and translation
- **Multilingual Support** — Full interface and AI-generated content in 8 languages: English, Spanish, French, German, Portuguese, Italian, Polish, and Hindi
- **Text-to-Speech** — Reads the entire simplified document aloud via ElevenLabs; individual jargon terms can also be heard in the popup
- **Comprehension Checklist** — Before signing, patients check off 3–5 AI-generated key points to confirm understanding
- **Signature Confirmation** — After completing the checklist, a confirmation screen with a 1–5 star experience rating is shown

---

## Project Structure

```
ClearConsent/
├── frontend/                     # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── TopBar.jsx        # Header: language selector, read-aloud button
│   │   │   ├── ConsentPanel.jsx  # Renders simplified text, jargon popups
│   │   │   ├── BottomBar.jsx     # Footer: progress bar, quiz & sign buttons
│   │   │   └── QuizModal.jsx     # Comprehension checklist + confirmation screen
│   │   ├── App.jsx               # Root component: PDF upload, state, TTS logic
│   │   └── main.jsx              # React entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── server/                       # Express.js backend
    ├── index.js                  # Server entry point
    ├── routes/
    │   ├── simplify.js           # POST /api/simplify — Gemini AI text simplification
    │   └── speak.js              # POST /api/speak — ElevenLabs text-to-speech
    ├── middleware/
    │   └── upload.js             # Multer config (PDF only, 10MB max)
    ├── utils/
    │   ├── elevenlabs.js         # ElevenLabs TTS client
    │   └── pdfParser.js          # Server-side PDF text extraction
    └── package.json
```

---

## Tech Stack

**Frontend**
- React 19 + Vite
- PDF.js (`pdfjs-dist`) — client-side PDF parsing and rendering

**Backend**
- Node.js + Express 5
- Google Gemini 2.5 Flash (`@google/generative-ai`)
- ElevenLabs (`elevenlabs`) — text-to-speech
- Multer — file upload handling
- dotenv — environment variable management

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/)
- An [ElevenLabs API key](https://elevenlabs.io/)

### 1. Clone the repo

```bash
git clone https://github.com/Gavinn-B/ConsentIQ.git
cd ConsentIQ
```

### 2. Configure environment variables

Create a `.env` file inside the `server/` directory:

```
GEMINI_API_KEY=your_gemini_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### 3. Start the backend

```bash
cd server
npm install
node index.js
```

Server runs on `http://localhost:3000`.

### 4. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5174` (or the port Vite assigns).

---

## API Endpoints

| Method | Route | Description | Body |
|--------|-------|-------------|------|
| `POST` | `/api/simplify` | Simplifies medical text using Gemini AI | `{ text: string, language: string }` |
| `POST` | `/api/speak` | Converts text to speech via ElevenLabs | `{ text: string }` |

### `/api/simplify` Response

```json
{
  "plain": [
    { "title": "Section Name", "text": "Plain language content with __jargon__ terms marked." }
  ],
  "jargon": {
    "jargon term": {
      "definition": "Plain language definition.",
      "translation": "Translated term in the selected language"
    }
  },
  "keyPoints": [
    "Short plain-language sentence summarizing a key point.",
    "..."
  ]
}
```

### `/api/speak` Response

Returns a binary `audio/mpeg` stream.

---

## Supported Languages

| Code | Language   |
|------|------------|
| `en` | English    |
| `es` | Spanish    |
| `fr` | French     |
| `de` | German     |
| `pt` | Portuguese |
| `it` | Italian    |
| `pl` | Polish     |
| `hi` | Hindi      |

Changing the language selector automatically re-translates the simplified content and all UI text.

---

## Usage

1. Open the app in your browser
2. Click **Choose PDF** and upload a medical consent form
3. The simplified plain-language version appears on the right
4. Click any highlighted word to see its definition; click the speaker icon in the popup to hear it
5. Use the language selector in the top bar to switch languages
6. Click the **🔊** button to hear the entire document read aloud (pause/resume supported)
7. Click **Take Comprehension Quiz** in the bottom bar
8. Check off each key point to confirm understanding
9. Click **I Understand** → review the confirmation screen and submit a star rating
10. Click **Sign & Confirm** to complete
