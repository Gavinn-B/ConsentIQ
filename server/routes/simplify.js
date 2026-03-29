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

        const prompt = `You are helping patients understand a medical consent form.

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

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();

        let parsed;
        try {
            parsed = JSON.parse(responseText);
        } catch {
            // Strip markdown fences, then extract just the outermost JSON object
            const stripped = responseText.replace(/^```json\s*/i, '').replace(/```[\s\S]*$/, '').trim();
            const start = stripped.indexOf('{');
            const end = stripped.lastIndexOf('}');
            if (start === -1 || end === -1) throw new Error('No JSON object found in Gemini response');
            parsed = JSON.parse(stripped.slice(start, end + 1));
        }

        // Strip any markdown bold markers (**text** or **text:*) that Gemini sneaks into text fields
        if (parsed.plain) {
            parsed.plain = parsed.plain.map(section => ({
                ...section,
                text: (section.text || '').replace(/\*\*([^*]+)\*?\*/g, '$1'),
            }));
        }

        res.json(parsed);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || 'Failed to simplify document' });
    }
});

export default router;
