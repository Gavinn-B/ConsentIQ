import { Router } from "express";
import upload from "../middleware/upload.js";
import { extractTextFromPdf } from "../utils/pdfParser.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  it: 'Italian',
  pl: 'Polish',
  hi: 'Hindi',
};

// Shared prompt builder used by both the standard and streaming routes
function buildPrompt(rawText, languageName) {
  return `You are helping patients understand a medical consent form.

Rewrite the following consent form in simple, plain ${languageName} that anyone can understand.

Return a JSON object with exactly three fields:

1. "plain": an array of section objects. Each object has:
   - "title": a short section heading written in ${languageName}
   - "text": the section content in simple ${languageName}. For lists use bullet lines starting with "* ".

   IMPORTANT — Patient information fields (name, date of birth, MRN, doctor, etc.):
   - Always place these in a single section titled "Patient Information" as the FIRST section.
   - Format each field as a bullet line: "* Label: Value" (e.g. "* Patient Name: Rafael A. Martinez").
   - Preserve the original order of the fields exactly as they appear in the document.
   - Do NOT reword, reorder, or combine these fields.

   IMPORTANT — Formatting rules for ALL sections:
   - Do NOT use markdown bold (**text** or **text:*) anywhere inside "text" fields. Plain text only.
   - Do NOT repeat the section title as a label inside the text. If the section is "Pre-Operative Assessment", do not also write "* Pre-Operative Assessment:" inside the text.
   - Each bullet line should be a plain sentence or "* Label: Value", never "* **Label:*".

   Wrap ONLY true clinical or medical jargon terms in double underscores like __this__.
   CRITICAL: Terms inside __ must ALWAYS be written in English, even when the rest of the text is in ${languageName}.
   Do NOT wrap: document titles, section headings, patient names, doctor names, hospital names, dates, or common everyday words.

2. "jargon": an object where each key is the English term you wrapped in __ and the value is an object with:
   - "translation": the term translated into ${languageName} (if ${languageName} is English, same as the key)
   - "definition": a simple one-sentence definition in ${languageName}

3. "keyPoints": an array of 3 to 5 short, plain-language sentences — the most important things this specific patient must understand before signing. Written in ${languageName}.

   Cover things like: what procedure they are agreeing to, the main risks, the fact that they can ask questions or withdraw consent, and any critical details unique to this form. Each point should be one clear sentence a patient can read and confirm they understand.

Only return valid JSON. No markdown, no code blocks, just the raw JSON.

Consent form text:
${rawText}`;
}

// Strips markdown bold markers that Gemini sometimes adds to text fields
function cleanSectionText(section) {
  return { ...section, text: (section.text || '').replace(/\*\*([^*]+)\*?\*/g, '$1') };
}

// Safely parses a JSON string, extracting the outermost { } block if needed.
// Uses bracket counting to find the true end of the JSON object rather than
// lastIndexOf, which can land inside a nested string value.
function safeParseJSON(text) {
  // Strip markdown fences first
  const stripped = text.replace(/^```json\s*/i, '').replace(/```[\s\S]*$/, '').trim();

  try {
    return JSON.parse(stripped);
  } catch {
    const start = stripped.indexOf('{');
    if (start === -1) throw new Error('No JSON object found in Gemini response');

    // Walk forward counting braces to find where the outermost object closes
    let depth = 0;
    let inString = false;
    let escape = false;
    let end = -1;

    for (let i = start; i < stripped.length; i++) {
      const ch = stripped[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }

    if (end === -1) throw new Error('Incomplete JSON object in Gemini response');
    return JSON.parse(stripped.slice(start, end + 1));
  }
}

// Scans the accumulated buffer for complete section objects inside the "plain" array.
// Uses bracket/quote tracking to safely find closed { } objects.
// Returns only sections beyond the ones already sent (skipCount).
function extractCompleteSections(buffer, skipCount) {
  const plainStart = buffer.indexOf('"plain"');
  if (plainStart === -1) return [];
  const arrayStart = buffer.indexOf('[', plainStart);
  if (arrayStart === -1) return [];

  const sections = [];
  let i = arrayStart + 1;
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escape = false;

  while (i < buffer.length) {
    const ch = buffer[i];
    if (escape) { escape = false; i++; continue; }
    if (ch === '\\' && inString) { escape = true; i++; continue; }
    if (ch === '"') { inString = !inString; i++; continue; }
    if (inString) { i++; continue; }

    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        try {
          const obj = JSON.parse(buffer.slice(objStart, i + 1));
          sections.push(obj);
        } catch { /* incomplete or malformed — skip */ }
        objStart = -1;
      }
    } else if (ch === ']' && depth === 0) {
      break;
    }
    i++;
  }

  return sections.slice(skipCount);
}

// Standard (non-streaming) route — kept as fallback
router.post("/simplify", upload.single('file'), async (req, res) => {
  try {
    let rawText = '';
    if (req.file) {
      rawText = await extractTextFromPdf(req.file.buffer);
    } else if (req.body.text) {
      rawText = req.body.text;
    } else {
      return res.status(400).json({ error: 'No file or text provided' });
    }

    const language = req.body.language || 'en';
    const languageName = LANGUAGE_NAMES[language] || 'English';
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(buildPrompt(rawText, languageName));
    const parsed = safeParseJSON(result.response.text().trim());

    if (parsed.plain) parsed.plain = parsed.plain.map(cleanSectionText);
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to simplify document' });
  }
});

// Streaming route — sends each plain section as an SSE event as Gemini generates it,
// then sends jargon + keyPoints in a final "done" event.
router.post("/simplify-stream", upload.single('file'), async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (payload) => res.write(`data: ${JSON.stringify(payload)}\n\n`);

  try {
    let rawText = '';
    if (req.file) {
      rawText = await extractTextFromPdf(req.file.buffer);
    } else if (req.body.text) {
      rawText = req.body.text;
    } else {
      send({ type: 'error', error: 'No file or text provided' });
      return res.end();
    }

    const language = req.body.language || 'en';
    const languageName = LANGUAGE_NAMES[language] || 'English';
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContentStream(buildPrompt(rawText, languageName));

    let buffer = '';
    let sentSections = 0;

    // Stream chunks from Gemini; emit each complete section object immediately
    for await (const chunk of result.stream) {
      buffer += chunk.text();
      const newSections = extractCompleteSections(buffer, sentSections);
      for (const section of newSections) {
        send({ type: 'section', section: cleanSectionText(section) });
        sentSections++;
      }
    }

    // Full response is now in buffer — parse for jargon and keyPoints
    const parsed = safeParseJSON(buffer);
    send({ type: 'done', jargon: parsed.jargon || {}, keyPoints: parsed.keyPoints || [] });
    res.end();

  } catch (err) {
    console.error(err);
    send({ type: 'error', error: err.message || 'Failed to simplify document' });
    res.end();
  }
});

export default router;
