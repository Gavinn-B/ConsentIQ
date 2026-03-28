import { Router } from "express";
import upload from "../middleware/upload.js";
import { extractTextFromPdf } from "../utils/pdfParser.js";
import { textToSpeech } from "../utils/elevenlabs.js";
import { simplifyMedicalText } from "../services/geminiService.js";
import { createRequire } from "module";
// JSON imports need createRequire in ES module context
const require = createRequire(import.meta.url);
const jargonGlossary = require('../data/jargonGlossary.json');

const router = Router();

// POST /simplify
// Accepts a PDF file upload OR raw text body, returns Gemini-simplified version
router.post("/simplify", upload.single('file'), async (req, res) => {
    try {
        let rawText = '';

        if (req.file) {
            // PDF path — uses buffer directly (no temp file to clean up)
            rawText = await extractTextFromPdf(req.file.buffer);
        } else if (req.body.text) {
            // Plain text path
            rawText = req.body.text;
        } else {
            return res.status(400).json({ error: 'No file or text provided' });
        }

        // Call Gemini to simplify the extracted text
        const { simplifiedText, detectedJargon } = await simplifyMedicalText(rawText);

        // Match detected terms against the glossary for pop-up modal data
        const glossaryMatches = {};
        for (const term of detectedJargon) {
            const key = term.toLowerCase().trim();
            if (jargonGlossary[key]) {
                glossaryMatches[key] = jargonGlossary[key];
            }
        }

        res.json({
            rawText,          
            simplifiedText,  
            detectedJargon,  
            glossaryMatches  
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to simplify text', details: err.message });
    }
});

// GET /glossary
// Returns the full jargon glossary
router.get("/glossary", (req, res) => {
    res.json(jargonGlossary);
});

// POST /quiz-data
// Array of jargon terms is sent, get back quiz hints and definitions
router.post("/quiz-data", (req, res) => {
    const { terms } = req.body;

    if (!Array.isArray(terms)) {
        return res.status(400).json({ error: 'terms must be an array of strings.' });
    }

    const quizData = terms
        .map(t => {
            const entry = jargonGlossary[t.toLowerCase().trim()];
            if (!entry) return null;
            return {
                term: t,
                hint: entry.quizHint,
                definition: entry.simpleDefinition
            };
        })
        .filter(Boolean);

    res.json({ quizData });
});

router.post('/speak', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'No text provided' });
  
        const audioStream = await textToSpeech(text);
  
        res.setHeader('Content-Type', 'audio/mpeg');
        for await (const chunk of audioStream) {
            res.write(chunk);
        }
        res.end();
  
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'TTS failed' });
    }
});

export default router;